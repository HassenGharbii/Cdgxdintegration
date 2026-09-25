"""Polls Milestone XProtect for camera alarms and upserts them into the
`camera_alarms` table, matched to the `equipements` inventory by IP.

NOT YET VERIFIED AGAINST A REAL XPROTECT SERVER — no credentials/server were
available while building this. The auth flow (IDP token endpoint, password
grant, client_id "GrantValidatorClient") matches Milestone's documented
REST API pattern, and the endpoint paths/field names below are the standard
XProtect REST Configuration/Alarm API shape — but XProtect versions differ,
so confirm XPROTECT_ALARMS_PATH / XPROTECT_CAMERAS_PATH and the field names
in `_map_alarm` / `_camera_ip` against the real server's API docs
(https://<server>/api/rest/v1/swagger or /v2/swagger usually has this) once
reachable, and adjust.

Defaults to XPROTECT_SIMULATE=true (fake alarms on real equipment IPs) so
the rest of the pipeline (DB, backend, dashboard) can be built and demoed
before real credentials exist. Set XPROTECT_SIMULATE=false once configured.
"""

import os
import random
import re
import time
import uuid
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras
import requests

DB_HOST = os.getenv('POSTGRES_HOST', 'localhost')
DB_PORT = os.getenv('POSTGRES_PORT', '5432')
DB_NAME = os.getenv('POSTGRES_DB', 'cdgxpress')
DB_USER = os.getenv('POSTGRES_USER', 'cdgxpress_user')
DB_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'password')

XPROTECT_SIMULATE = os.getenv('XPROTECT_SIMULATE', 'true').lower() == 'true'
XPROTECT_BASE_URL = os.getenv('XPROTECT_BASE_URL', 'https://xprotect.local')
XPROTECT_TOKEN_URL = os.getenv('XPROTECT_TOKEN_URL', f'{XPROTECT_BASE_URL}/IDP/connect/token')
XPROTECT_CLIENT_ID = os.getenv('XPROTECT_CLIENT_ID', 'GrantValidatorClient')
XPROTECT_USERNAME = os.getenv('XPROTECT_USERNAME', '')
XPROTECT_PASSWORD = os.getenv('XPROTECT_PASSWORD', '')
XPROTECT_ALARMS_PATH = os.getenv('XPROTECT_ALARMS_PATH', '/api/rest/v1/alarms')
XPROTECT_CAMERAS_PATH = os.getenv('XPROTECT_CAMERAS_PATH', '/api/rest/v1/cameras')
XPROTECT_VERIFY_SSL = os.getenv('XPROTECT_VERIFY_SSL', 'false').lower() == 'true'

POLL_INTERVAL = int(os.getenv('ALARM_POLL_INTERVAL', '15'))
CAMERA_CACHE_REFRESH_CYCLES = 20  # re-resolve camera->IP mapping every N cycles


def connect_with_retry():
    while True:
        try:
            conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD)
            print("Connexion PostgreSQL etablie.")
            return conn
        except Exception as e:
            print(f"Connexion impossible : {e}. Nouvelle tentative dans 5s...")
            time.sleep(5)


def upsert_alarms(conn, alarms):
    if not alarms:
        return
    with conn.cursor() as cur:
        psycopg2.extras.execute_batch(cur, """
            INSERT INTO camera_alarms
                (source_alarm_id, ip, camera_name, alarm_type, message, priority, state, triggered_at, raw)
            VALUES
                (%(source_alarm_id)s, %(ip)s, %(camera_name)s, %(alarm_type)s, %(message)s,
                 %(priority)s, %(state)s, %(triggered_at)s, %(raw)s)
            ON CONFLICT (source_alarm_id) DO UPDATE SET
                state = EXCLUDED.state,
                message = EXCLUDED.message,
                priority = EXCLUDED.priority,
                raw = EXCLUDED.raw
        """, alarms)
        conn.commit()


# ─── Real XProtect client ─────────────────────────────────────────────────

class XProtectClient:
    def __init__(self):
        self._token = None
        self._token_expiry = datetime.min

    def _authenticate(self):
        resp = requests.post(
            XPROTECT_TOKEN_URL,
            data={
                'grant_type': 'password',
                'username': XPROTECT_USERNAME,
                'password': XPROTECT_PASSWORD,
                'client_id': XPROTECT_CLIENT_ID,
            },
            verify=XPROTECT_VERIFY_SSL,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        self._token = data['access_token']
        self._token_expiry = datetime.now() + timedelta(seconds=data.get('expires_in', 3600) - 60)

    def _headers(self):
        if self._token is None or datetime.now() >= self._token_expiry:
            self._authenticate()
        return {'Authorization': f'Bearer {self._token}'}

    def get_cameras(self):
        """Returns {camera_id: {"ip": ..., "name": ...}}. Field names/shape
        (hardware.address containing the IP) match the standard XProtect
        Configuration API — verify against the real server."""
        resp = requests.get(f'{XPROTECT_BASE_URL}{XPROTECT_CAMERAS_PATH}', headers=self._headers(),
                             verify=XPROTECT_VERIFY_SSL, timeout=10)
        resp.raise_for_status()
        cameras = {}
        for cam in resp.json().get('data', resp.json().get('Cameras', [])):
            address = cam.get('address') or cam.get('hardware', {}).get('address', '')
            ip_match = re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', address)
            cameras[cam.get('id')] = {
                'ip': ip_match.group(0) if ip_match else None,
                'name': cam.get('name') or cam.get('displayName'),
            }
        return cameras

    def get_alarms(self):
        resp = requests.get(f'{XPROTECT_BASE_URL}{XPROTECT_ALARMS_PATH}', headers=self._headers(),
                             verify=XPROTECT_VERIFY_SSL, timeout=10)
        resp.raise_for_status()
        return resp.json().get('data', resp.json().get('Alarms', []))


def _map_alarm(raw_alarm, camera_lookup):
    source_id = raw_alarm.get('sourceId') or raw_alarm.get('deviceId')
    camera = camera_lookup.get(source_id, {})
    triggered_raw = raw_alarm.get('timeCreated') or raw_alarm.get('eventTime')
    try:
        triggered_at = datetime.fromisoformat(triggered_raw.replace('Z', '+00:00')) if triggered_raw else datetime.now()
    except ValueError:
        triggered_at = datetime.now()
    return {
        'source_alarm_id': str(raw_alarm.get('id') or raw_alarm.get('alarmId')),
        'ip': camera.get('ip'),
        'camera_name': camera.get('name') or raw_alarm.get('name'),
        'alarm_type': raw_alarm.get('category') or raw_alarm.get('listName') or raw_alarm.get('name'),
        'message': raw_alarm.get('message') or raw_alarm.get('name'),
        'priority': str(raw_alarm.get('priority', '')),
        'state': raw_alarm.get('state', 'New'),
        'triggered_at': triggered_at,
        'raw': psycopg2.extras.Json(raw_alarm),
    }


def run_real_cycle(client, camera_cache):
    alarms = [_map_alarm(a, camera_cache) for a in client.get_alarms()]
    return alarms


# ─── Simulation mode (no XProtect server needed) ──────────────────────────

ALARM_TYPES = ['Perte de signal', 'Détection de mouvement', 'Sabotage caméra', 'Enregistrement interrompu']
PRIORITIES = ['Faible', 'Moyenne', 'Critique']

_open_sim_alarms = []


def get_equipment_ips(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT ip, name FROM equipements WHERE active = true ORDER BY id")
        rows = cur.fetchall()
    if rows:
        return rows
    # Fresh install, nothing in `equipements` yet — fall back to a plausible sample.
    return [{'ip': f'10.136.115.{60 + i}', 'name': f'Camera {i + 1}'} for i in range(16)]


def run_simulated_cycle(conn):
    equipment = get_equipment_ips(conn)
    alarms = []

    # Maybe raise a new alarm this cycle.
    if random.random() < 0.4:
        eq = random.choice(equipment)
        alarm_id = str(uuid.uuid4())
        alarm = {
            'source_alarm_id': alarm_id,
            'ip': eq['ip'],
            'camera_name': eq['name'],
            'alarm_type': random.choice(ALARM_TYPES),
            'message': f"{random.choice(ALARM_TYPES)} sur {eq['name']}",
            'priority': random.choice(PRIORITIES),
            'state': 'New',
            'triggered_at': datetime.now(),
            'raw': psycopg2.extras.Json({'simulated': True}),
        }
        alarms.append(alarm)
        _open_sim_alarms.append(alarm_id)

    # Maybe close an older simulated alarm.
    if _open_sim_alarms and random.random() < 0.3:
        closing_id = _open_sim_alarms.pop(0)
        alarms.append({
            'source_alarm_id': closing_id,
            'ip': None, 'camera_name': None, 'alarm_type': None, 'message': None, 'priority': None,
            'state': 'Closed',
            'triggered_at': datetime.now(),
            'raw': psycopg2.extras.Json({'simulated': True, 'closed': True}),
        })
        # ON CONFLICT UPDATE only touches state/message/priority/raw, so the
        # NULLs above would wipe the original row's info — refetch instead.
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT ip, camera_name, alarm_type FROM camera_alarms WHERE source_alarm_id = %s", (closing_id,))
            existing = cur.fetchone()
        if existing:
            alarms[-1].update(existing)
            alarms[-1]['message'] = f"{alarms[-1]['alarm_type']} résolue sur {alarms[-1]['camera_name']}"

    return alarms


def main():
    conn = connect_with_retry()
    client = None if XPROTECT_SIMULATE else XProtectClient()
    camera_cache = {}
    cycle = 0

    mode = "SIMULATE (fake alarms)" if XPROTECT_SIMULATE else f"real ({XPROTECT_BASE_URL})"
    print(f"XProtect alarms poller starting — mode: {mode}")

    try:
        while True:
            try:
                if XPROTECT_SIMULATE:
                    alarms = run_simulated_cycle(conn)
                else:
                    if cycle % CAMERA_CACHE_REFRESH_CYCLES == 0:
                        camera_cache = client.get_cameras()
                    alarms = run_real_cycle(client, camera_cache)
                upsert_alarms(conn, alarms)
                if alarms:
                    print(f"{len(alarms)} alarme(s) mise(s) a jour.")
            except psycopg2.OperationalError:
                print("Perte de connexion DB, reconnexion...")
                conn = connect_with_retry()
            except requests.RequestException as e:
                print(f"Erreur XProtect: {e}")
            cycle += 1
            time.sleep(POLL_INTERVAL)
    except KeyboardInterrupt:
        print("\nArret demande.")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
