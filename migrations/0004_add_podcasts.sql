-- Migration number: 0004 	 2026-07-14
CREATE TABLE podcasts (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
