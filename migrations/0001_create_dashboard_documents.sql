-- Dashboard sync documents (Cloudflare D1 / SQLite)
CREATE TABLE IF NOT EXISTS dashboard_documents (
  doc_type TEXT PRIMARY KEY CHECK (doc_type IN ('warranty', 'service', 'review', 'view_state')),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_dashboard_documents_updated_at
  ON dashboard_documents(updated_at);
