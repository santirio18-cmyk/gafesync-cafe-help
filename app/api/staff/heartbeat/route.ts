import { heartbeat } from "@/lib/store";
import { getStaffToken, verifySignedSession } from "@/lib/auth";

export async function POST() {
  const token = await getStaffToken();
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (verifySignedSession(token)) {
    return Response.json({ ok: true });
  }
  const ok = await heartbeat(token);
  return Response.json({ ok });
}
