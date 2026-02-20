import { NextRequest } from "next/server";
import { attendHelpRequest } from "@/lib/store";
import { getSessionFromRequest, getStaffIdFromRequest } from "@/lib/auth";
import { getStaffById } from "@/lib/store";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest();
  const staffId = session?.staffId ?? (await getStaffIdFromRequest());
  if (!staffId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const staffName = session ? (session.displayName || session.username) : null;
  const staff = staffName ? { id: staffId, displayName: staffName, username: session!.username } : await getStaffById(staffId);
  if (!staff) {
    return Response.json({ error: "Staff not found" }, { status: 401 });
  }
  const { id } = await params;
  const req = await attendHelpRequest(id, staff.id, staff.displayName || staff.username);
  if (!req) {
    return Response.json({ error: "Request not found or already attended" }, { status: 404 });
  }
  return Response.json(req);
}
