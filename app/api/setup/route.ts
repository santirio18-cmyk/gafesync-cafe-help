import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { createStaff, getTables, addTable, getStaffByUsername } from "@/lib/store";

// One-time setup: create default staff and tables if empty. In production, protect this route.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const secret = body?.secret;
    if (process.env.NODE_ENV === "production" && secret !== process.env.SETUP_SECRET) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const created: string[] = [];
    const tables = await getTables();
    if (tables.length === 0) {
      const tableNumbers = [1, 2, 3, 4, 5, 6, 7, 8];
      for (const n of tableNumbers) await addTable(n);
      created.push("tables: " + tableNumbers.join(", "));
    }
    const defaultUsername = body?.staffUsername || "staff";
    const defaultPassword = body?.staffPassword || "gamesync123";
    if (!(await getStaffByUsername(defaultUsername))) {
      const hash = await bcrypt.hash(defaultPassword, 10);
      await createStaff(defaultUsername, hash, "Cafe Staff");
      created.push("staff user: " + defaultUsername);
    }
    if (!(await getStaffByUsername("admin"))) {
      const adminHash = await bcrypt.hash("admin123", 10);
      await createStaff("admin", adminHash, "Admin");
      created.push("staff user: admin");
    }
    return Response.json({ ok: true, created });
  } catch (e) {
    return Response.json({ error: "Setup failed" }, { status: 500 });
  }
}
