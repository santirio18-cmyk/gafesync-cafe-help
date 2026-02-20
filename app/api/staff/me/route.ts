import { getSessionFromRequest, getStaffIdFromRequest } from "@/lib/auth";
import { getStaffById } from "@/lib/store";

export async function GET() {
  const session = await getSessionFromRequest();
  if (session) {
    return Response.json({
      id: session.staffId,
      username: session.username,
      displayName: session.displayName || session.username,
    });
  }
  const staffId = await getStaffIdFromRequest();
  if (!staffId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const staff = await getStaffById(staffId);
  if (!staff) {
    return Response.json({ error: "Staff not found" }, { status: 401 });
  }
  return Response.json({
    id: staff.id,
    username: staff.username,
    displayName: staff.displayName,
  });
}
