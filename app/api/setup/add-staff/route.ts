import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { createStaff, getStaffByUsername } from "@/lib/store";

// Add one or more staff. In production, require SETUP_SECRET in body.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (process.env.NODE_ENV === "production" && body?.secret !== process.env.SETUP_SECRET) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const staffList = Array.isArray(body.staff) ? body.staff : [body];
    const created: string[] = [];
    const skipped: string[] = [];
    for (const s of staffList) {
      const username = s?.username?.trim();
      const password = s?.password;
      const displayName = s?.displayName?.trim() || username;
      if (!username || !password) {
        skipped.push((username || "?") + " (missing username or password)");
        continue;
      }
      if (getStaffByUsername(username)) {
        skipped.push(username + " (already exists)");
        continue;
      }
      const hash = await bcrypt.hash(password, 10);
      createStaff(username, hash, displayName);
      created.push(username);
    }
    return Response.json({ ok: true, created, skipped });
  } catch (e) {
    return Response.json({ error: "Failed to add staff" }, { status: 500 });
  }
}
