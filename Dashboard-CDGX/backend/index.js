const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const XLSX = require('xlsx');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const pino = require('pino');
const pinoHttp = require('pino-http');
const http = require('http');
const https = require('https');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'cibest_secret_key_change_in_production';

// tx2 (the passenger-counting FastAPI service, "Serveur IA")
const TX2_API_URL = (process.env.TX2_API_URL || 'http://10.136.115.100:8000').replace(/\/$/, '');

// CORS — origines autorisees configurables via ALLOWED_ORIGINS (CSV)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, cb) => {
    // Autoriser les appels sans origin (outils, Postman) et les origines reconnues
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origine non autorisee — ${origin}`));
  },
  credentials: true,
}));

// Rate limiting sur le login — 10 tentatives par 15 minutes par IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Trop de tentatives, reessayez dans 15 minutes.' },
});

// HTTP request logger
app.use(pinoHttp({ logger }));

// PostgreSQL connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'db',
  port: process.env.POSTGRES_PORT || process.env.DB_PORT || 5432,
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'cdgxpress',
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'cdgxpress_user',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'password',
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
});

// Middleware
app.use(cors());
app.use(express.json());

// ─── Auth Middleware ──────────────────────────────────────────────────────────

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Token manquant' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, error: 'Token invalide' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// ─── Seed default admin on startup ───────────────────────────────────────────

const seedAdmin = async () => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(result.rows[0].count) === 0) {
      const hash = await bcrypt.hash('Admin123!', 10);
      await pool.query(
        `INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        ['admin', 'admin@cibest.local', hash, 'admin']
      );
      logger.info('Compte admin par defaut cree (admin / Admin123!)');
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Seed admin echoue (table peut-etre absente)');
  }
};

// ─── Auth Routes ─────────────────────────────────────────────────────────────

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Identifiants requis' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ─── Admin: User Management ───────────────────────────────────────────────────

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'Champs requis: username, email, password' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, is_active, created_at`,
      [username, email, hash, role || 'operator']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Nom d\'utilisateur ou email déjà utilisé' });
    }
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { username, email, role, is_active, password } = req.body;

  try {
    let query, params;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query = `UPDATE users SET username=$1, email=$2, role=$3, is_active=$4, password_hash=$5
               WHERE id=$6 RETURNING id, username, email, role, is_active, created_at`;
      params = [username, email, role, is_active, hash, id];
    } else {
      query = `UPDATE users SET username=$1, email=$2, role=$3, is_active=$4
               WHERE id=$5 RETURNING id, username, email, role, is_active, created_at`;
      params = [username, email, role, is_active, id];
    }

    const result = await pool.query(query, params);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Nom d\'utilisateur ou email déjà utilisé' });
    }
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user.id) {
    return res.status(400).json({ success: false, error: 'Impossible de supprimer son propre compte' });
  }

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ─── Admin: Equipment Import / Export ────────────────────────────────────────

// Download blank template
app.get('/api/admin/equipements/template', authenticateToken, requireAdmin, (req, res) => {
  const rows = [
    { Nom: 'Camera 01', 'Adresse IP': '10.136.115.60', Type: 'Camera', Localisation: 'Entrée principale', Description: 'Caméra PTZ extérieure' },
    { Nom: 'Camera 02', 'Adresse IP': '10.136.115.61', Type: 'Camera', Localisation: 'Parking', Description: '' },
    { Nom: 'Switch Core', 'Adresse IP': '10.136.115.1',  Type: 'Switch', Localisation: 'Salle serveurs', Description: 'Switch principal' },
    { Nom: 'Serveur IA',  'Adresse IP': '10.136.115.100', Type: 'Server', Localisation: 'Datacenter', Description: 'Serveur inference IA' },
  ];
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 20 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Equipements');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="modele_equipements.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// Export all equipment to Excel
app.get('/api/admin/equipements/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name, ip, type, location, description, active FROM equipements ORDER BY created_at'
    );
    const rows = result.rows.map(e => ({
      Nom: e.name,
      'Adresse IP': e.ip,
      Type: e.type,
      Localisation: e.location || '',
      Description: e.description || '',
      Actif: e.active ? 'oui' : 'non',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Equipements');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="equipements_export.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Import equipment from Excel
app.post('/api/admin/equipements/import', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier fourni' });
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);
    if (rows.length === 0) return res.status(400).json({ success: false, error: 'Fichier vide' });

    let added = 0, skipped = 0, errors = [];

    for (const row of rows) {
      const name = (row['Nom'] || row['name'] || '').toString().trim();
      const ip   = (row['Adresse IP'] || row['ip'] || '').toString().trim();
      const type = (row['Type'] || row['type'] || 'Camera').toString().trim();
      const location    = (row['Localisation'] || row['location'] || '').toString().trim() || null;
      const description = (row['Description'] || row['description'] || '').toString().trim() || null;

      if (!name || !ip) { errors.push(`Ligne ignorée : nom ou IP manquant`); skipped++; continue; }

      try {
        const r = await pool.query(
          `INSERT INTO equipements (name, ip, type, location, description)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (ip) DO NOTHING`,
          [name, ip, type, location, description]
        );
        r.rowCount > 0 ? added++ : (skipped++, errors.push(`${ip} : IP déjà existante, ignorée`));
      } catch (err) {
        errors.push(`${ip} : ${err.message}`);
        skipped++;
      }
    }

    res.json({ success: true, added, skipped, errors });
  } catch {
    res.status(400).json({ success: false, error: 'Fichier Excel invalide ou corrompu' });
  }
});

// ─── Admin: Equipment Management ─────────────────────────────────────────────

app.get('/api/admin/equipements', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipements ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.post('/api/admin/equipements', authenticateToken, requireAdmin, async (req, res) => {
  const { name, ip, type, location, description } = req.body;
  if (!name || !ip) {
    return res.status(400).json({ success: false, error: 'Champs requis: name, ip' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO equipements (name, ip, type, location, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, ip, type || 'Camera', location || null, description || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Une adresse IP identique existe déjà' });
    }
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.put('/api/admin/equipements/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, ip, type, location, description, active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE equipements SET name=$1, ip=$2, type=$3, location=$4, description=$5, active=$6
       WHERE id=$7 RETURNING *`,
      [name, ip, type, location, description, active, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Équipement introuvable' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Une adresse IP identique existe déjà' });
    }
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.delete('/api/admin/equipements/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM equipements WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Équipement introuvable' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ─── Comptage passagers (tx2 passenger-counting service, on the Jetson) ──────
// Thin proxy — tx2 owns its own Postgres for instances/events/train-state.
// This keeps the frontend behind the single VITE_API_URL like every other
// page, without duplicating tx2's persistence here.

const tx2Fetch = async (path, options) => {
  const res = await fetch(`${TX2_API_URL}${path}`, options);
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
};

app.get('/api/comptage-passagers/instances', async (req, res) => {
  try {
    const { ok, status, body } = await tx2Fetch('/api/instances');
    if (!ok) return res.status(status).json({ success: false, error: 'tx2 a répondu en erreur' });
    res.json({ success: true, data: body });
  } catch (err) {
    logger.error({ err }, 'tx2 unreachable');
    res.status(502).json({ success: false, error: 'Service de comptage (tx2) injoignable' });
  }
});

app.get('/api/comptage-passagers/instances/:id/events', async (req, res) => {
  try {
    const { ok, status, body } = await tx2Fetch(`/api/instances/${req.params.id}/events`);
    if (!ok) return res.status(status).json({ success: false, error: 'tx2 a répondu en erreur' });
    res.json({ success: true, data: body });
  } catch (err) {
    logger.error({ err }, 'tx2 unreachable');
    res.status(502).json({ success: false, error: 'Service de comptage (tx2) injoignable' });
  }
});

app.post('/api/comptage-passagers/instances/:id/start', authenticateToken, async (req, res) => {
  try {
    const { ok, status, body } = await tx2Fetch(`/api/instances/${req.params.id}/start`, { method: 'POST' });
    if (!ok) return res.status(status).json({ success: false, error: 'tx2 a répondu en erreur' });
    res.json({ success: true, data: body });
  } catch (err) {
    logger.error({ err }, 'tx2 unreachable');
    res.status(502).json({ success: false, error: 'Service de comptage (tx2) injoignable' });
  }
});

app.post('/api/comptage-passagers/instances/:id/stop', authenticateToken, async (req, res) => {
  try {
    const { ok, status, body } = await tx2Fetch(`/api/instances/${req.params.id}/stop`, { method: 'POST' });
    if (!ok) return res.status(status).json({ success: false, error: 'tx2 a répondu en erreur' });
    res.json({ success: true, data: body });
  } catch (err) {
    logger.error({ err }, 'tx2 unreachable');
    res.status(502).json({ success: false, error: 'Service de comptage (tx2) injoignable' });
  }
});

app.get('/api/comptage-passagers/train-state', async (req, res) => {
  try {
    const { ok, status, body } = await tx2Fetch('/api/train-state');
    if (!ok) return res.status(status).json({ success: false, error: status === 404 ? 'Aucune donnée train reçue' : 'tx2 a répondu en erreur' });
    res.json({ success: true, data: body });
  } catch (err) {
    logger.error({ err }, 'tx2 unreachable');
    res.status(502).json({ success: false, error: 'Service de comptage (tx2) injoignable' });
  }
});

// Live MJPEG stream — piped through so the browser only ever talks to
// VITE_API_URL, never the Jetson's address directly.
app.get('/api/comptage-passagers/instances/:id/stream', (req, res) => {
  const target = `${TX2_API_URL}/api/instances/${req.params.id}/stream`;
  const client = target.startsWith('https') ? https : http;

  const upstream = client.get(target, (upstreamRes) => {
    if (upstreamRes.statusCode !== 200) {
      res.status(upstreamRes.statusCode).end();
      return;
    }
    res.setHeader('Content-Type', upstreamRes.headers['content-type'] || 'multipart/x-mixed-replace');
    upstreamRes.pipe(res);
  });

  upstream.on('error', (err) => {
    logger.error({ err }, 'tx2 stream unreachable');
    if (!res.headersSent) res.status(502).end();
  });

  req.on('close', () => upstream.destroy());
});

// ─── Alarms (Milestone XProtect, via the alarms-poller service) ──────────────
// camera_alarms is populated by alarms-poller/xprotect_alarms.py and matched
// to the equipements inventory by IP.

// GET /api/alarms?ip=&camera=&alarm_type=&state=&priority=&from=&to=&limit=
app.get('/api/alarms', async (req, res) => {
  const { ip, camera, alarm_type, state, priority, from, to } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 2000);

  const clauses = [];
  const params = [];

  if (ip) { params.push(`%${ip}%`); clauses.push(`ca.ip ILIKE $${params.length}`); }
  if (camera) { params.push(`%${camera}%`); clauses.push(`ca.camera_name ILIKE $${params.length}`); }
  if (alarm_type) { params.push(alarm_type); clauses.push(`ca.alarm_type = $${params.length}`); }
  if (state) { params.push(state); clauses.push(`ca.state = $${params.length}`); }
  if (priority) { params.push(priority); clauses.push(`ca.priority = $${params.length}`); }
  if (from) { params.push(from); clauses.push(`ca.triggered_at >= $${params.length}`); }
  if (to) { params.push(to); clauses.push(`ca.triggered_at <= $${params.length}`); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  params.push(limit);

  try {
    const result = await pool.query(`
      SELECT ca.*, e.type AS equipment_type, e.location
      FROM camera_alarms ca
      LEFT JOIN equipements e ON e.ip = ca.ip
      ${where}
      ORDER BY ca.triggered_at DESC
      LIMIT $${params.length}
    `, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Distinct values to populate filter dropdowns — reflects whatever data
// actually exists (real or simulated), not a hardcoded list.
app.get('/api/alarms/meta', async (req, res) => {
  try {
    const [types, states, priorities] = await Promise.all([
      pool.query('SELECT DISTINCT alarm_type FROM camera_alarms WHERE alarm_type IS NOT NULL ORDER BY alarm_type'),
      pool.query('SELECT DISTINCT state FROM camera_alarms ORDER BY state'),
      pool.query('SELECT DISTINCT priority FROM camera_alarms WHERE priority IS NOT NULL AND priority != \'\' ORDER BY priority'),
    ]);
    res.json({
      success: true,
      alarm_types: types.rows.map(r => r.alarm_type),
      states: states.rows.map(r => r.state),
      priorities: priorities.rows.map(r => r.priority),
    });
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.get('/api/alarms/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE state != 'Closed') AS active,
        COUNT(*) FILTER (WHERE state != 'Closed' AND priority ILIKE 'critique%') AS critical,
        COUNT(DISTINCT ip) FILTER (WHERE state != 'Closed' AND ip IS NOT NULL) AS cameras_affected,
        COUNT(*) FILTER (WHERE triggered_at >= NOW() - INTERVAL '24 hours') AS last_24h
      FROM camera_alarms
    `);
    res.json({ success: true, summary: result.rows[0] });
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.get('/api/alarms/by-ip/:ip', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM camera_alarms WHERE ip = $1 ORDER BY triggered_at DESC',
      [req.params.ip]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.post('/api/alarms/:id/ack', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE camera_alarms SET state = 'Acknowledged', acknowledged_at = NOW(), acknowledged_by = $1
       WHERE id = $2 RETURNING *`,
      [req.user.username, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Alarme introuvable' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ─── Public API Routes ────────────────────────────────────────────────────────

app.get('/api/cibest/equipements', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (ip) id, ip, name, reachable, rtt_ms, ttl, timestamp, error
      FROM ping_results
      ORDER BY ip, timestamp DESC;
    `);

    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString(),
      total_equipements: result.rowCount,
    });
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ success: false, error: 'DB query failed' });
  }
});

app.get('/api/cibest/equipements/status', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ip, reachable
      FROM (
        SELECT DISTINCT ON (ip) ip, reachable
        FROM ping_results
        ORDER BY ip, timestamp DESC
      ) latest;
    `);

    const total = result.rows.length;
    const online = result.rows.filter(r => r.reachable === 'true').length;
    const offline = total - online;

    res.json({
      success: true,
      summary: {
        total_equipements: total,
        online,
        offline,
        uptime_percentage: total > 0 ? Math.round((online / total) * 10000) / 100 : 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ success: false, error: 'DB query failed' });
  }
});

app.get('/api/cibest/equipements/:equipementId', async (req, res) => {
  try {
    const id = parseInt(req.params.equipementId);
    const result = await pool.query(
      `SELECT * FROM ping_results WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: `Equipement with ID ${id} not found` });
    }

    res.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ success: false, error: 'DB query failed' });
  }
});

// Historical RTT data for a given IP — used by TimelinePerformance
// GET /api/cibest/history?ip=10.x.x.x&range=1h|6h|24h
app.get('/api/cibest/history', async (req, res) => {
  const { ip, range } = req.query;

  if (!ip) {
    return res.status(400).json({ success: false, error: 'Parametre ip requis' });
  }

  const hours = range === '6h' ? 6 : range === '24h' ? 24 : 1;

  try {
    const result = await pool.query(
      `SELECT ip, name, reachable, rtt_ms, ttl, timestamp
       FROM ping_results
       WHERE ip = $1
         AND timestamp >= NOW() - INTERVAL '${hours} hours'
       ORDER BY timestamp ASC`,
      [ip]
    );

    res.json({
      success: true,
      ip,
      range: `${hours}h`,
      data: result.rows,
    });
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ success: false, error: 'DB query failed' });
  }
});

// Aggregated history for all equipements (average RTT per time bucket)
// GET /api/cibest/history/all?range=1h|6h|24h
app.get('/api/cibest/history/all', async (req, res) => {
  const { range } = req.query;
  const hours = range === '6h' ? 6 : range === '24h' ? 24 : 1;
  const bucket = hours <= 1 ? '5 minutes' : hours <= 6 ? '15 minutes' : '1 hour';

  try {
    const result = await pool.query(
      `SELECT
         date_trunc('minute', timestamp) - (
           EXTRACT(minute FROM timestamp)::int % $1
         ) * INTERVAL '1 minute' AS bucket,
         ROUND(AVG(rtt_ms)::numeric, 2) AS avg_rtt,
         COUNT(*) FILTER (WHERE reachable = 'true') AS online_count,
         COUNT(*) AS total_count
       FROM ping_results
       WHERE timestamp >= NOW() - INTERVAL '${hours} hours'
       GROUP BY bucket
       ORDER BY bucket ASC`,
      [hours <= 1 ? 5 : hours <= 6 ? 15 : 60]
    );

    res.json({
      success: true,
      range: `${hours}h`,
      bucket,
      data: result.rows,
    });
  } catch (err) {
    logger.error({ err });
    res.status(500).json({ success: false, error: 'DB query failed' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM ping_results;');
    res.json({
      status: 'healthy',
      service: 'Cibest Equipement Monitoring API (Node.js)',
      timestamp: new Date().toISOString(),
      rows_in_db: parseInt(result.rows[0].count, 10),
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      error: 'DB not reachable',
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── DB init ──────────────────────────────────────────────────────────────────

pool.connect(async (err, client, release) => {
  if (err) {
    logger.error({ err }, 'Erreur de connexion a la base de donnees');
  } else {
    logger.info('Connexion PostgreSQL etablie');
    release();
    await seedAdmin();
  }
});

pool.on('error', (err) => {
  logger.error({ err }, 'Erreur inattendue sur client idle');
});

// ─── Server ───────────────────────────────────────────────────────────────────

const server = app.listen(port, host, () => {
  logger.info(`API server running at http://${host}:${port}`);
});

server.on('error', (err) => {
  logger.error({ err }, 'Erreur serveur');
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM recu, arret gracieux');
  server.close(() => { pool.end(() => process.exit(0)); });
});

process.on('SIGINT', () => {
  logger.info('SIGINT recu, arret gracieux');
  server.close(() => { pool.end(() => process.exit(0)); });
});
