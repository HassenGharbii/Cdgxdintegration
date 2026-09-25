import socket
from datetime import datetime

UDP_PORT = 5600

def compute_lrc(frame: str) -> str:
    """Compute 1-byte LRC checksum."""
    checksum = sum(bytearray(frame, "utf-8")) & 0xFF
    return f"[{checksum}]"

def send_stat_request(ip, retries=3, timeout=2):
    """
    Send STAT=?[LRC] to a device over UDP and wait for response.
    """
    frame = "STAT=?"
    message = frame + compute_lrc(frame)

    print(f"\n📡 Sending to {ip}:{UDP_PORT} → {message}")

    for attempt in range(1, retries + 1):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(timeout)

            print(f"➡️ Attempt {attempt}/{retries} | Sending STAT request...")
            sock.sendto(message.encode("utf-8"), (str(ip), UDP_PORT))

            data, _ = sock.recvfrom(1024)
            response = data.decode("utf-8").strip()

            print(f"✅ Response from {ip}: {response}")

            sock.close()

            if response.startswith("STAT="):
                return {
                    "ip": str(ip),
                    "reachable": True,
                    "response": response,
                    "timestamp": datetime.now(),
                    "error": None
                }
            else:
                print(f"⚠️ Unexpected response format from {ip}: {response}")

        except socket.timeout:
            print(f"⏱️ Timeout waiting for response (attempt {attempt}) from {ip}")
        except Exception as e:
            print(f"❌ Error communicating with {ip} (attempt {attempt}): {e}")
        finally:
            sock.close()

    print(f"❌ No valid response from {ip} after {retries} attempts.")

    return {
        "ip": str(ip),
        "reachable": False,
        "response": None,
        "timestamp": datetime.now(),
        "error": "No response after retries"
    }
