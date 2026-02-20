import { NextRequest } from "next/server";
import { getTables, addTable } from "@/lib/store";

export async function GET() {
  return Response.json(await getTables());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const number = Number(body?.number);
    if (!Number.isInteger(number) || number < 1) {
      return Response.json({ error: "Invalid table number" }, { status: 400 });
    }
    const table = await addTable(number);
    return Response.json(table);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to add table";
    return Response.json({ error: message }, { status: 400 });
  }
}
