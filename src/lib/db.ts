import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { foldText } from "./utils";

// Keep in sync with scripts/import-supabase.mjs
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  ingredients TEXT NOT NULL,
  image_path TEXT,
  source_url TEXT,
  is_public INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
`;

export function getDataDir(): string {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

export function getImageDir(): string {
  return path.join(getDataDir(), "images");
}

const globalForDb = globalThis as unknown as { __eetspiratieDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (globalForDb.__eetspiratieDb) return globalForDb.__eetspiratieDb;

  const dataDir = getDataDir();
  fs.mkdirSync(getImageDir(), { recursive: true });

  const db = new DatabaseSync(path.join(dataDir, "eetspiratie.db"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);

  // Accent- and case-insensitive search helper (SQLite's LIKE only folds ASCII)
  db.function("fold", { deterministic: true }, (value: unknown) =>
    typeof value === "string" ? foldText(value) : null,
  );

  globalForDb.__eetspiratieDb = db;
  return db;
}
