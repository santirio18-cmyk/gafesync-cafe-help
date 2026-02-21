import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { createStaff, getTables, addTable, getStaffByUsername, updateStaffPassword, isDatabaseUnavailableError } from "@/lib/store";
import { NAMED_STAFF } from "@/lib/staff-passwords";

// One-time setup: create default staff and tables if empty.
// In production, if SETUP_SECRET is set you must pass it in body.secret; if not set, setup is allowed from Admin.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const secret = body?.secret;
    const setupSecret = process.env.SETUP_SECRET;
    if (process.env.NODE_ENV === "production" && setupSecret != null && setupSecret !== "" && secret !== setupSecret) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const created: string[] = [];
    const tables = await getTables();
    const existingNumbers = new Set(tables.map((t) => t.number));
    const tableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const added: number[] = [];
    for (const n of tableNumbers) {
      if (!existingNumbers.has(n)) {
        await addTable(n);
        added.push(n);
      }
    }
    if (added.length > 0) created.push("tables: " + added.join(", "));
    const defaultUsername = body?.staffUsername || "staff";
    const defaultPassword = body?.staffPassword || "gamesync123";
    if (!(await getStaffByUsername(defaultUsername))) {
      const hash = await bcrypt.hash(defaultPassword, 10);
      await createStaff(defaultUsername, hash, "Cafe Staff");
      created.push("staff user: " + defaultUsername);
    }
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const existingAdmin = await getStaffByUsername("admin");
    if (!existingAdmin) {
      const adminHash = await bcrypt.hash(adminPassword, 10);
      await createStaff("admin", adminHash, "Admin");
      created.push("staff user: admin");
    } else if (process.env.ADMIN_PASSWORD) {
      const adminHash = await bcrypt.hash(adminPassword, 10);
      await updateStaffPassword("admin", adminHash);
      created.push("admin password updated from ADMIN_PASSWORD");
    }
    for (const s of NAMED_STAFF) {
      if (!(await getStaffByUsername(s.username))) {
        const hash = await bcrypt.hash(s.password, 10);
        await createStaff(s.username, hash, s.displayName);
        created.push("staff user: " + s.username);
      }
    }
    return Response.json({ ok: true, created });
  } catch (e) {
    if (isDatabaseUnavailableError(e)) {
      const message = e instanceof Error ? e.message : "Database not configured. In production, add Redis (Upstash) in Vercel and set KV_REST_API_URL and KV_REST_API_TOKEN. Then redeploy.";
      return Response.json({ error: message, code: "DATABASE_NOT_CONFIGURED" }, { status: 503 });
    }
    return Response.json({ error: "Could not create tables and staff" }, { status: 500 });
  }
}
