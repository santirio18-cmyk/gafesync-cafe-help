import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getStaffByUsername, createSession } from "@/lib/store";

const STAFF_COOKIE = "gafesync_staff_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = body?.username?.trim();
    const password = body?.password;
    if (!username || !password) {
      return Response.json({ error: "Username and password required" }, { status: 400 });
    }
    const staff = await getStaffByUsername(username);
    if (!staff) {
      return Response.json({ error: "Invalid username or password" }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, staff.passwordHash);
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
