#!/usr/bin/env node
// One-off migration: copies all recipes + images from the old Supabase project
// into the local SQLite database and image folder.
//
// Usage (in the container, see README):
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_ANON_KEY=... \
//   SUPABASE_EMAIL=you@example.com \
//   SUPABASE_PASSWORD=... \
//   node scripts/import-supabase.mjs
//
// Safe to run more than once: recipes that already exist (same id) are skipped.

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_EMAIL, SUPABASE_PASSWORD } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_EMAIL || !SUPABASE_PASSWORD) {
  console.error("Set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_EMAIL and SUPABASE_PASSWORD.");
  process.exit(1);
}

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
const imageDir = path.join(dataDir, "images");
fs.mkdirSync(imageDir, { recursive: true });

// Keep in sync with src/lib/db.ts
const db = new DatabaseSync(path.join(dataDir, "eetspiratie.db"));
db.exec("PRAGMA journal_mode = WAL;");
db.exec(`
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
`);

const base = SUPABASE_URL.replace(/\/+$/, "");

async function signIn() {
  const res = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: SUPABASE_EMAIL, password: SUPABASE_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed (${res.status}): ${await res.text()}`);
  return (await res.json()).access_token;
}

async function fetchRecipes(token) {
  const all = [];
  for (let offset = 0; ; offset += 500) {
    const res = await fetch(
      `${base}/rest/v1/recipes?select=*&order=created_at.asc&limit=500&offset=${offset}`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error(`Fetching recipes failed (${res.status}): ${await res.text()}`);
    const page = await res.json();
    all.push(...page);
    if (page.length < 500) return all;
  }
}

function detectImageType(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.subarray(0, 4).toString("latin1") === "GIF8") return "gif";
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  return null;
}

async function downloadImage(token, imagePath) {
  const encoded = imagePath.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(`${base}/storage/v1/object/authenticated/recipe-images/${encoded}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.warn(`  ! image ${imagePath} not downloaded (${res.status})`);
    return null;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = detectImageType(buf);
  if (!ext) {
    console.warn(`  ! image ${imagePath} is not a supported image type, skipped`);
    return null;
  }
  const name = `${randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(imageDir, name), buf);
  return name;
}

function slugify(title) {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 100) || "recept"
  );
}

const exists = db.prepare("SELECT 1 FROM recipes WHERE id = ?");
const slugTaken = db.prepare("SELECT 1 FROM recipes WHERE slug = ?");
const insert = db.prepare(`
  INSERT INTO recipes (id, title, slug, description, ingredients, image_path, source_url, is_public, created_at, updated_at)
  VALUES (:id, :title, :slug, :description, :ingredients, :image_path, :source_url, :is_public, :created_at, :updated_at)
`);

const token = await signIn();
const recipes = await fetchRecipes(token);
console.log(`Found ${recipes.length} recipes in Supabase`);

let imported = 0;
for (const r of recipes) {
  if (exists.get(r.id)) {
    console.log(`- skip (already imported): ${r.title}`);
    continue;
  }

  let slug = r.slug || slugify(r.title);
  for (let i = 1; slugTaken.get(slug); i++) slug = `${r.slug || slugify(r.title)}-${i}`;

  const image = r.image_path ? await downloadImage(token, r.image_path) : null;
  const now = new Date().toISOString();

  insert.run({
    id: r.id,
    title: r.title,
    slug,
    description: r.description ?? null,
    ingredients: r.ingredients ?? "",
    image_path: image,
    source_url: r.source_url ?? null,
    is_public: r.is_public ? 1 : 0,
    created_at: r.created_at ? new Date(r.created_at).toISOString() : now,
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : now,
  });
  imported++;
  console.log(`+ ${r.title}${image ? " (with image)" : ""}`);
}

console.log(`Done: ${imported} imported, ${recipes.length - imported} skipped.`);
