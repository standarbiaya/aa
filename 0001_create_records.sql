CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kl_code TEXT NOT NULL DEFAULT '',
  kl_name TEXT NOT NULL,
  program_name TEXT NOT NULL DEFAULT '',
  activity_name TEXT NOT NULL DEFAULT '',
  output_name TEXT NOT NULL DEFAULT '',
  unit_name TEXT NOT NULL DEFAULT '',
  budget REAL NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_records_kl_code ON records(kl_code);
CREATE INDEX IF NOT EXISTS idx_records_kl_name ON records(kl_name);
