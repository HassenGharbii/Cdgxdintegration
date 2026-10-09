CREATE TABLE IF NOT EXISTS camera_alarms (
    id SERIAL PRIMARY KEY,
    source_alarm_id VARCHAR(100) NOT NULL UNIQUE,
    ip VARCHAR(15),
    camera_name VARCHAR(100),
    alarm_type VARCHAR(100),
    message TEXT,
    priority VARCHAR(20),
    state VARCHAR(20) NOT NULL DEFAULT 'New',
    triggered_at TIMESTAMP NOT NULL,
    acknowledged_at TIMESTAMP,
    acknowledged_by VARCHAR(50),
    raw JSONB
);
CREATE INDEX IF NOT EXISTS camera_alarms_ip_idx ON camera_alarms (ip);
CREATE INDEX IF NOT EXISTS camera_alarms_triggered_at_idx ON camera_alarms (triggered_at DESC);