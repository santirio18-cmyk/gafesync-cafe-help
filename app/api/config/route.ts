import { NextRequest } from "next/server";
import { networkInterfaces } from "os";

// Returns a base URL that works when scanning QR from phone (same WiFi).
// Uses this machine's local IP so phone can reach the app.
function getLocalNetworkUrl(port: string): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    const iface = nets[name];
    if (!iface) continue;
    for (const config of iface) {
      if (config.family === "IPv4" && !config.internal) {
        return `http://${config.address}:${port}`;
      }
    }
  }
  return "";
}

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:3000";
  const isVercel = host.includes("vercel.app");
  const port = host.includes(":") ? host.split(":")[1] : "3000";
  const localUrl = getLocalNetworkUrl(port);
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const base = isVercel ? `${protocol}://${host}` : (localUrl || `http://${host}`);
  return Response.json({
    qrBaseUrl: base,
    origin: request.nextUrl.origin,
  });
}
