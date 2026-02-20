import { NextRequest } from "next/server";
import { createHelpRequest, getHelpRequests, getStaffById } from "@/lib/store";
import { getStaffIdFromRequest, getSessionFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tableNumber = Number(body?.tableNumber);
    if (!Number.isInteger(tableNumber) || tableNumber < 1) {
      return Response.json({ error: "Invalid table number" }, { status: 400 });
    }
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const req = await createHelpRequest(tableNumber);
        return Response.json(req);
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        if (attempt === 0) await new Promise((r) => setTimeout(r, 500));
      }
    }
    const message = lastError?.message ?? "Failed to create help request";
    return Response.json({ error: message }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create help request";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const onlyPending = request.nextUrl.searchParams.get("pending") === "true";
  if (onlyPending) {
    const staffId = await getStaffIdFromRequest();
    if (!staffId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  } else {
    const session = await getSessionFromRequest();
    const staffId = session?.staffId ?? (await getStaffIdFromRequest());
    if (!staffId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const staff = await getStaffById(staffId);
    const username = session?.username ?? staff?.username;
    if (username !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
  }
  const requests = await getHelpRequests(onlyPending);
  return Response.json(requests);
}
