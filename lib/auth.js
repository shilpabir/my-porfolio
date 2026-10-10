import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const sessionCookieName = "portfolio_admin_session";
const sessionDurationSeconds = 60 * 60 * 8;

function constantTimeEqual(left, right) {
  const leftHash = createHash("sha256").update(String(left)).digest();
  const rightHash = createHash("sha256").update(String(right)).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

export function missingAdminConfiguration() {
  return [
    "ADMIN_PATH",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "SESSION_SECRET",
  ].filter((name) => !process.env[name]);
}

function sign(value) {
  return createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

export function credentialsAreValid(email, password) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local.");
  }
  return (
    constantTimeEqual(email.trim().toLowerCase(), adminEmail.trim().toLowerCase()) &&
    constantTimeEqual(password, adminPassword)
  );
}

export function createSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({ expiresAt: Date.now() + sessionDurationSeconds * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function isSessionValid(request) {
  return isSessionTokenValid(request.cookies.get(sessionCookieName)?.value);
}

export function isSessionTokenValid(token) {
  if (!token) return false;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;
  if (!constantTimeEqual(sign(payload), signature)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString());
    return Number.isFinite(session.expiresAt) && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}
