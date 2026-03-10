"use server";

import { revalidateTag } from "next/cache";
import { requireAuth } from "./supabase/server";

export async function invalidateRecipesCache() {
  const { user } = await requireAuth();
  revalidateTag(`recipes-${user.id}`);
}
