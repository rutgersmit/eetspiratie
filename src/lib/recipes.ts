import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { foldText, generateSlug } from "./utils";
import type { Recipe, SortOption } from "@/types/database";

type Row = Omit<Recipe, "is_public"> & { is_public: number };

function toRecipe(row: unknown): Recipe {
  const r = row as Row;
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    ingredients: r.ingredients,
    image_path: r.image_path,
    source_url: r.source_url,
    is_public: r.is_public === 1,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

const ORDER_BY: Record<SortOption, string> = {
  newest: "created_at DESC",
  oldest: "created_at ASC",
  "title-asc": "title COLLATE NOCASE ASC",
  "title-desc": "title COLLATE NOCASE DESC",
};

export function listRecipes(opts: {
  search: string;
  sort: SortOption;
  page: number;
  pageSize: number;
}): { recipes: Recipe[]; count: number } {
  const db = getDb();
  const term = foldText(opts.search.trim());
  const where = term
    ? "WHERE fold(title) LIKE :q ESCAPE '\\' OR fold(ingredients) LIKE :q ESCAPE '\\' OR fold(description) LIKE :q ESCAPE '\\'"
    : "";
  const params: Record<string, string | number> = {};
  if (term) params.q = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

  const { count } = db
    .prepare(`SELECT COUNT(*) AS count FROM recipes ${where}`)
    .get(params) as { count: number };

  const rows = db
    .prepare(
      `SELECT * FROM recipes ${where} ORDER BY ${ORDER_BY[opts.sort] ?? ORDER_BY.newest} LIMIT :limit OFFSET :offset`,
    )
    .all({ ...params, limit: opts.pageSize, offset: (opts.page - 1) * opts.pageSize });

  return { recipes: rows.map(toRecipe), count };
}

export function getRecipeById(id: string): Recipe | null {
  const row = getDb().prepare("SELECT * FROM recipes WHERE id = ?").get(id);
  return row ? toRecipe(row) : null;
}

export function getRecipeBySlug(slug: string): Recipe | null {
  const row = getDb().prepare("SELECT * FROM recipes WHERE slug = ?").get(slug);
  return row ? toRecipe(row) : null;
}

export function getPublicRecipeBySlug(slug: string): Recipe | null {
  const row = getDb()
    .prepare("SELECT * FROM recipes WHERE slug = ? AND is_public = 1")
    .get(slug);
  return row ? toRecipe(row) : null;
}

function uniqueSlug(title: string, excludeId?: string): string {
  const base = generateSlug(title) || "recept";
  const stmt = getDb().prepare("SELECT 1 FROM recipes WHERE slug = ? AND id != ?");
  let slug = base;
  for (let i = 1; stmt.get(slug, excludeId ?? ""); i++) slug = `${base}-${i}`;
  return slug;
}

export interface RecipeInput {
  title: string;
  description: string | null;
  ingredients: string;
  source_url: string | null;
  image_path: string | null;
}

export function createRecipe(input: RecipeInput): Recipe {
  const now = new Date().toISOString();
  const recipe: Recipe = {
    id: randomUUID(),
    slug: uniqueSlug(input.title),
    is_public: false,
    created_at: now,
    updated_at: now,
    ...input,
  };
  getDb()
    .prepare(
      `INSERT INTO recipes (id, title, slug, description, ingredients, image_path, source_url, is_public, created_at, updated_at)
       VALUES (:id, :title, :slug, :description, :ingredients, :image_path, :source_url, 0, :created_at, :updated_at)`,
    )
    .run({
      id: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      description: recipe.description,
      ingredients: recipe.ingredients,
      image_path: recipe.image_path,
      source_url: recipe.source_url,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at,
    });
  return recipe;
}

export function updateRecipe(existing: Recipe, input: RecipeInput): Recipe {
  const slug = existing.title !== input.title ? uniqueSlug(input.title, existing.id) : existing.slug;
  const updated_at = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE recipes SET title = :title, slug = :slug, description = :description, ingredients = :ingredients,
       image_path = :image_path, source_url = :source_url, updated_at = :updated_at WHERE id = :id`,
    )
    .run({ ...input, slug, updated_at, id: existing.id });
  return { ...existing, ...input, slug, updated_at };
}

export function setRecipePublic(id: string, isPublic: boolean) {
  getDb().prepare("UPDATE recipes SET is_public = ? WHERE id = ?").run(isPublic ? 1 : 0, id);
}

export function deleteRecipeRow(id: string) {
  getDb().prepare("DELETE FROM recipes WHERE id = ?").run(id);
}
