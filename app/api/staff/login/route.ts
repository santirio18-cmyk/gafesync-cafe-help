import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getStaffByUsername, createSession, createStaff } from "@/lib/store";

const STAFF_COOKIE = "gafesync_staff_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const DEFAULT_USERS: { username: string; password: string; displayName: string }[] = [
  { username: "admin", password: "admin123", displayName: "Admin" },
  { username: "staff", password: "gamesync123", displayName: "Cafe Staff" },
  { username: "sanajay", password: "gamesync123", displayName: "Sanajay" },
  { username: "arvind", password: "gamesync123", displayName: "Arvind" },
  { username: "chiti", password: "gamesync123", displayName: "Chiti" },
  { username: "ashok", password: "gamesync123", displayName: "Ashok" },
  { username: "bivish", password: "gamesync123", displayName: "Bivish" },
];

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
      const def = DEFAULT_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase());
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
    const token = await createSession(staff.id);
    const res = NextResponse.json({
      ok: true,
      staff: { id: staff.id, username: staff.username, displayName: staff.displayName },
    });
    res.cookies.set(STAFF_COOKIE, token, {
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
