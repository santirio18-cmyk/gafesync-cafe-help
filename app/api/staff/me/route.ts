import { getStaffIdFromRequest } from "@/lib/auth";
import { getStaffById } from "@/lib/store";

export async function GET() {
  const staffId = await getStaffIdFromRequest();
  if (!staffId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const staff = getStaffById(staffId);
  if (!staff) {
    return Response.json({ error: "Staff not found" }, { status: 401 });
  }
  return Response.json({
    id: staff.id,
    username: staff.username,
    displayName: staff.displayName,
  });
}
