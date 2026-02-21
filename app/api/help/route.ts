import { NextRequest } from "next/server";
import { createHelpRequest, getHelpRequests, getHelpRequestsAttendedBy, getStaffById, isDatabaseUnavailableError } from "@/lib/store";
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
        if (isDatabaseUnavailableError(e)) break;
        if (attempt === 0) await new Promise((r) => setTimeout(r, 500));
      }
    }
    if (lastError && isDatabaseUnavailableError(lastError)) {
      return Response.json(
        { error: lastError.message, code: "DATABASE_NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    const message = lastError?.message ?? "Failed to create help request";
    return Response.json({ error: message }, { status: 400 });
  } catch (e) {
    if (isDatabaseUnavailableError(e)) {
      const message = e instanceof Error ? e.message : "Database not configured. Add Redis in Vercel (KV_REST_API_URL, KV_REST_API_TOKEN).";
      return Response.json({ error: message, code: "DATABASE_NOT_CONFIGURED" }, { status: 503 });
    }
    const message = e instanceof Error ? e.message : "Failed to create help request";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const onlyPending = request.nextUrl.searchParams.get("pending") === "true";
  const mine = request.nextUrl.searchParams.get("mine") === "true";

  if (mine) {
    const staffId = await getStaffIdFromRequest();
    if (!staffId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const requests = await getHelpRequestsAttendedBy(staffId);
    return Response.json(requests);
  }
  if (onlyPending) {
    const staffId = await getStaffIdFromRequest();
    if (!staffId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const requests = await getHelpRequests(true);
    return Response.json(requests);
  }
  const session = await getSessionFromRequest();
  const staffId = session?.staffId ?? (await getStaffIdFromRequest());
  if (!staffId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const staff = await getStaffById(staffId);
  const username = session?.username ?? staff?.username;
  if (username !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
  const requests = await getHelpRequests(false);
  return Response.json(requests);
}
