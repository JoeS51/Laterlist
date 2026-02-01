-- Migration number: 0001 	 2026-02-01T22:47:37.056Z
CREATE TABLE links (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
