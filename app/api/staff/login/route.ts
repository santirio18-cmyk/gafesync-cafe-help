import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getStaffByUsername, createStaff, updateStaffPassword } from "@/lib/store";
import { NAMED_STAFF, ADMIN_PASSWORD } from "@/lib/staff-passwords";
import { createSignedSession } from "@/lib/auth";

const STAFF_COOKIE = "gafesync_staff_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const DEFAULT_USERS: { username: string; password: string; displayName: string }[] = [
  { username: "admin", password: ADMIN_PASSWORD, displayName: "Admin" },
  { username: "staff", password: "gamesync123", displayName: "Cafe Staff" },
  ...NAMED_STAFF.map((s) => ({ username: s.username, password: s.password, displayName: s.displayName })),
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = body?.username?.trim();
    const password = typeof body?.password === "string" ? body.password.trim() : "";
    if (!username || !password) {
      return Response.json({ error: "Username and password required" }, { status: 400 });
    }
    let staff = await getStaffByUsername(username);
    if (!staff) {
      const def = DEFAULT_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (def && def.password === password) {
        const hash = await bcrypt.hash(password, 10);
        staff = await createStaff(def.username, hash, def.displayName);
      }
    }
    if (!staff) {
      return Response.json({ error: "Invalid username or password" }, { status: 401 });
    }
    let ok = staff.passwordHash ? await bcrypt.compare(password, staff.passwordHash) : false;
    if (!ok && staff.username === "admin" && password === ADMIN_PASSWORD) {
      await updateStaffPassword("admin", await bcrypt.hash(ADMIN_PASSWORD, 10));
      ok = true;
    }
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
