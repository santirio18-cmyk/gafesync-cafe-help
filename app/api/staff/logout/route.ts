import { NextResponse } from "next/server";
import { getStaffToken } from "@/lib/auth";
import { logout } from "@/lib/store";

const STAFF_COOKIE = "gafesync_staff_token";

export async function POST() {
  const token = await getStaffToken();
  if (token) await logout(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STAFF_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}

