import { getActiveStaff } from "@/lib/store";

export async function GET() {
  const staff = getActiveStaff();
  return Response.json(staff.map((s) => ({ id: s.id, username: s.username, displayName: s.displayName })));
}
