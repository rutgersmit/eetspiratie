// In-memory limiter for failed login attempts. Resets when the server restarts,
// which is fine for a single-container, single-user app.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_CLIENT = 5;
// Global cap, so rotating a spoofed X-Forwarded-For header doesn't help.
const MAX_GLOBAL = 30;

const failures = new Map<string, number[]>();
let globalFailures: number[] = [];

function recent(times: number[], now: number) {
  return times.filter((t) => now - t < WINDOW_MS);
}

export function isLoginBlocked(clientKey: string): boolean {
  const now = Date.now();
  globalFailures = recent(globalFailures, now);
  const client = recent(failures.get(clientKey) ?? [], now);
  failures.set(clientKey, client);
  return client.length >= MAX_PER_CLIENT || globalFailures.length >= MAX_GLOBAL;
}

export function recordLoginFailure(clientKey: string) {
  const now = Date.now();
  failures.set(clientKey, [...recent(failures.get(clientKey) ?? [], now), now]);
  globalFailures.push(now);
  if (failures.size > 1000) failures.clear();
}

export function resetLoginFailures(clientKey: string) {
  failures.delete(clientKey);
}
