import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, getAuthConfig, verifySessionToken } from "./session";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

/** Redirects to /login unless the request carries a valid session. */
export async function requireAuth(): Promise<{ username: string }> {
  if (!(await isAuthenticated())) redirect("/login");
  return { username: getAuthConfig()!.username };
}
