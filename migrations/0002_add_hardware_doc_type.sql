-- Add 'hardware' to allowed doc_type values
-- SQLite doesn't support ALTER CHECK constraints, so we recreate the table

CREATE TABLE IF NOT EXISTS dashboard_documents_new (
  doc_type TEXT PRIMARY KEY CHECK (doc_type IN ('warranty', 'service', 'review', 'hardware', 'view_state')),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO dashboard_documents_new (doc_type, payload_json, updated_at, version)
  SELECT doc_type, payload_json, updated_at, version FROM dashboard_documents;

DROP TABLE IF EXISTS dashboard_documents;

ALTER TABLE dashboard_documents_new RENAME TO dashboard_documents;

CREATE INDEX IF NOT EXISTS idx_dashboard_documents_updated_at
  ON dashboard_documents(updated_at);
