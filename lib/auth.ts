import { cookies } from "next/headers";
import { getSessionStaffId } from "./store";

const STAFF_COOKIE = "gafesync_staff_token";

export async function getStaffToken(): Promise<string | null> {
  const c = await cookies();
  return c.get(STAFF_COOKIE)?.value ?? null;
}

export async function getStaffIdFromRequest(): Promise<string | null> {
  const token = await getStaffToken();
  if (!token) return null;
  return getSessionStaffId(token);
}
