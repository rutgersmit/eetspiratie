"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "./auth";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, getAuthConfig } from "./session";
import { isLoginBlocked, recordLoginFailure, resetLoginFailures } from "./rate-limit";
import { deleteImage, saveImage } from "./images";
import {
  createRecipe,
  deleteRecipeRow,
  getRecipeById,
  setRecipePublic,
  updateRecipe,
} from "./recipes";

type ActionResult = { error: string } | undefined;

function safeEqual(a: string, b: string): boolean {
  // Hash first so the comparison is constant-time regardless of input length
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

async function isSecureRequest(): Promise<boolean> {
  const override = process.env.COOKIE_SECURE;
  if (override === "true") return true;
  if (override === "false") return false;
  const h = await headers();
  return h.get("x-forwarded-proto")?.split(",")[0].trim() === "https";
}

export async function login(username: string, password: string): Promise<ActionResult> {
  const config = getAuthConfig();
  if (!config) {
    return { error: "Inloggen is niet geconfigureerd op de server. Zie de documentatie." };
  }

  const h = await headers();
  const clientKey = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";

  if (isLoginBlocked(clientKey)) {
    return { error: "Te veel mislukte pogingen. Probeer het over een kwartier opnieuw." };
  }

  const ok =
    safeEqual(String(username), config.username) && safeEqual(String(password), config.password);

  if (!ok) {
    recordLoginFailure(clientKey);
    await new Promise((r) => setTimeout(r, 500));
    return { error: "Onjuiste gebruikersnaam of wachtwoord" };
  }

  resetLoginFailures(clientKey);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSessionToken(config), {
    httpOnly: true,
    sameSite: "lax",
    secure: await isSecureRequest(),
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/recipes");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

function text(formData: FormData, key: string, maxLength: number): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function saveRecipe(formData: FormData): Promise<ActionResult> {
  await requireAuth();

  const id = text(formData, "id", 100);
  const title = text(formData, "title", 200);
  const description = text(formData, "description", 50_000);
  const ingredients = text(formData, "ingredients", 50_000);
  const sourceUrl = text(formData, "source_url", 2000);
  const removeImage = formData.get("remove_image") === "true";
  const image = formData.get("image");

  if (!title) return { error: "Titel is verplicht" };
  if (!ingredients) return { error: "Ingrediënten zijn verplicht" };

  if (sourceUrl) {
    // Only http(s): the URL is rendered as a link, so javascript: etc. must be rejected
    let parsed: URL | null = null;
    try {
      parsed = new URL(sourceUrl);
    } catch {
      // invalid URL, handled below
    }
    if (!parsed || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) {
      return { error: "Bron moet een geldige http(s)-link zijn" };
    }
  }

  const existing = id ? getRecipeById(id) : null;
  if (id && !existing) return { error: "Recept niet gevonden" };

  let imagePath = existing?.image_path ?? null;
  let newImage: string | null = null;
  if (image instanceof File && image.size > 0) {
    try {
      newImage = await saveImage(image);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Uploaden mislukt" };
    }
    imagePath = newImage;
  } else if (removeImage) {
    imagePath = null;
  }

  const input = {
    title,
    description: description || null,
    ingredients,
    source_url: sourceUrl || null,
    image_path: imagePath,
  };

  let slug: string;
  try {
    slug = existing ? updateRecipe(existing, input).slug : createRecipe(input).slug;
  } catch (err) {
    await deleteImage(newImage);
    console.error("Error saving recipe:", err);
    return { error: "Opslaan mislukt" };
  }

  if (existing?.image_path && existing.image_path !== imagePath) {
    await deleteImage(existing.image_path);
  }

  revalidatePath("/", "layout");
  redirect(`/recipes/${slug}`);
}

export async function deleteRecipe(id: string): Promise<ActionResult> {
  await requireAuth();
  const recipe = getRecipeById(String(id));
  if (!recipe) return { error: "Recept niet gevonden" };

  deleteRecipeRow(recipe.id);
  await deleteImage(recipe.image_path);

  revalidatePath("/", "layout");
  redirect("/recipes");
}

export async function togglePublic(id: string, isPublic: boolean): Promise<ActionResult> {
  await requireAuth();
  if (!getRecipeById(String(id))) return { error: "Recept niet gevonden" };
  setRecipePublic(String(id), Boolean(isPublic));
  revalidatePath("/", "layout");
}
