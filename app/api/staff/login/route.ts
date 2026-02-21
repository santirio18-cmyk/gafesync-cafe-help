import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getStaffByUsername, createStaff } from "@/lib/store";
import { NAMED_STAFF } from "@/lib/staff-passwords";
import { createSignedSession } from "@/lib/auth";

const STAFF_COOKIE = "gafesync_staff_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getDefaultUsers(): { username: string; password: string; displayName: string }[] {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  return [
    { username: "admin", password: adminPassword, displayName: "Admin" },
    { username: "staff", password: "gamesync123", displayName: "Cafe Staff" },
    ...NAMED_STAFF.map((s) => ({ username: s.username, password: s.password, displayName: s.displayName })),
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = body?.username?.trim();
    const password = body?.password;
    if (!username || !password) {
      return Response.json({ error: "Username and password required" }, { status: 400 });
    }
    let staff = await getStaffByUsername(username);
    if (!staff) {
      const def = getDefaultUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (def && def.password === password) {
        const hash = await bcrypt.hash(password, 10);
        staff = await createStaff(def.username, hash, def.displayName);
      }
    }
    if (!staff) {
      return Response.json({ error: "Invalid username or password" }, { status: 401 });
    }
    const ok = staff.passwordHash ? await bcrypt.compare(password, staff.passwordHash) : false;
    if (!ok) {
      return Response.json({ error: "Invalid username or password" }, { status: 401 });
    }
    const signed = createSignedSession({
      staffId: staff.id,
      displayName: staff.displayName || staff.username,
      username: staff.username,
    });
    const res = NextResponse.json({
      ok: true,
      staff: { id: staff.id, username: staff.username, displayName: staff.displayName },
    });
    res.cookies.set(STAFF_COOKIE, signed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return res;
  } catch (e) {
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}
