import { heartbeat } from "@/lib/store";
import { getStaffToken } from "@/lib/auth";

export async function POST() {
  const token = await getStaffToken();
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ok = await heartbeat(token);
  return Response.json({ ok });
}
