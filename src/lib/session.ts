// Session tokens signed with HMAC-SHA256 via Web Crypto, so this module works
// both in the proxy and in server components / actions.

export const SESSION_COOKIE = "eetspiratie_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, in seconds

const encoder = new TextEncoder();

export interface AuthConfig {
  username: string;
  password: string;
  secret: string;
}

/** Returns the auth config, or null when it is missing or too weak. */
export function getAuthConfig(): AuthConfig | null {
  const username = process.env.AUTH_USERNAME;
  const password = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!username || !password || !secret || secret.length < 32) return null;
  return { username, password, secret };
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(config: AuthConfig, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(config.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  // Username and password are part of the signed message, so changing either
  // (or AUTH_SECRET) invalidates every existing session.
  const payload = `v1|${message}|${config.username}|${config.password}`;
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(config: AuthConfig): Promise<string> {
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  return `${expires}.${await sign(config, String(expires))}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const config = getAuthConfig();
  if (!config || !token) return false;

  const [expires, signature, ...rest] = token.split(".");
  if (rest.length > 0 || !expires || !signature || !/^\d+$/.test(expires)) return false;
  if (Number(expires) < Date.now()) return false;

  return constantTimeEqual(signature, await sign(config, expires));
}
