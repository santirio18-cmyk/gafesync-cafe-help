import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { getSessionStaffId } from "./store";

const STAFF_COOKIE = "gafesync_staff_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Secret for signing session cookie. Set SESSION_SECRET in production. */
function getSessionSecret(): string {
  return process.env.SESSION_SECRET || "gafesync-dev-secret";
}

export type SessionPayload = {
  staffId: string;
  displayName: string;
  username: string;
  exp: number;
};

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Buffer | null {
  try {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
    return Buffer.from(padded, "base64");
  } catch {
    return null;
  }
}

/** Create a signed cookie value that works across serverless instances (no Redis needed). */
export function createSignedSession(payload: Omit<SessionPayload, "exp">): string {
  const exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE;
  const full: SessionPayload = { ...payload, exp };
  const raw = JSON.stringify(full);
  const encoded = base64UrlEncode(Buffer.from(raw, "utf8"));
  const sig = createHmac("sha256", getSessionSecret()).update(encoded).digest("hex");
  return `${encoded}.${sig}`;
}

/** Verify and parse signed cookie. Returns null if invalid or expired. */
export function verifySignedSession(cookieValue: string): SessionPayload | null {
  const dot = cookieValue.indexOf(".");
  if (dot === -1) return null;
  const encoded = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  const buf = base64UrlDecode(encoded);
  if (!buf) return null;
  const expectedSig = createHmac("sha256", getSessionSecret()).update(encoded).digest("hex");
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (sigBuf.length !== expectedBuf.length || sigBuf.length !== 32) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  let payload: SessionPayload;
  try {
    payload = JSON.parse(buf.toString("utf8"));
  } catch {
    return null;
  }
  if (!payload.staffId || !payload.exp || typeof payload.exp !== "number") return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export async function getStaffToken(): Promise<string | null> {
  const c = await cookies();
  return c.get(STAFF_COOKIE)?.value ?? null;
}

/** Prefer signed cookie (works without Redis); fall back to store session. */
export async function getStaffIdFromRequest(): Promise<string | null> {
  const token = await getStaffToken();
  if (!token) return null;
  const payload = verifySignedSession(token);
  if (payload) return payload.staffId;
  return await getSessionStaffId(token);
}

/** Get full session from signed cookie or null. Used so /api/staff/me and attend work without store lookup. */
export async function getSessionFromRequest(): Promise<SessionPayload | null> {
  const token = await getStaffToken();
  if (!token) return null;
  const payload = verifySignedSession(token);
  if (payload) return payload;
  const staffId = await getSessionStaffId(token);
  if (!staffId) return null;
  return { staffId, displayName: "", username: "", exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE };
}
