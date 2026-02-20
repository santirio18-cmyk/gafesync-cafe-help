import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { createStaff, getTables, addTable, getStaffByUsername } from "@/lib/store";

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
    const namedStaff = [
      { username: "sanajay", displayName: "Sanajay", password: "gamesync123" },
      { username: "arvind", displayName: "Arvind", password: "gamesync123" },
      { username: "chiti", displayName: "Chiti", password: "gamesync123" },
      { username: "ashok", displayName: "Ashok", password: "gamesync123" },
      { username: "bivish", displayName: "Bivish", password: "gamesync123" },
    ];
    for (const s of namedStaff) {
      if (!(await getStaffByUsername(s.username))) {
        const hash = await bcrypt.hash(s.password, 10);
        await createStaff(s.username, hash, s.displayName);
        created.push("staff user: " + s.username);
      }
    }
    return Response.json({ ok: true, created });
  } catch (e) {
    return Response.json({ error: "Setup failed" }, { status: 500 });
  }
}
