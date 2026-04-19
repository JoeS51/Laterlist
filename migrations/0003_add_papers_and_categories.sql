-- Migration number: 0003 	 2026-04-12T22:47:37.056Z
CREATE TABLE papers (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE paper_categories (
  paper_id TEXT NOT NULL, 
  category_id TEXT NOT NULL,
  PRIMARY KEY (paper_id, category_id),
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
