import { getTables, isStorePersistent } from "@/lib/store";

/**
 * GET /api/db-status — Check if the database (Redis) is working.
 * In production, data only persists when Redis is configured.
 */
export async function GET() {
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    const hasRedisEnv = !!(redisUrl && redisToken);
    const persistent = isStorePersistent();

    const tables = await getTables();
    const { getHelpRequests } = await import("@/lib/store");
    const requests = await getHelpRequests(false);
    const { getStaffByUsername } = await import("@/lib/store");
    const hasStaff = !!(await getStaffByUsername("admin"));

    const message = !persistent
      ? "Redis is required in production. Add KV_REST_API_URL and KV_REST_API_TOKEN in Vercel (e.g. via Upstash). Without Redis, requests and performance data are not saved."
      : hasRedisEnv && tables.length > 0
        ? "Database is working. Data is persisting in Redis."
        : hasRedisEnv
          ? "Redis is configured. Tables and staff are stored here. Open Admin (Tables & QR codes) to create them if the list is empty."
          : "Using file or memory (fine for local dev).";

    return Response.json({
      database: hasRedisEnv ? "Redis (configured)" : "memory or file",
      persistent,
      tablesCount: tables.length,
      helpRequestsCount: requests.length,
      hasStaff: hasStaff,
      message,
    });
  } catch (e) {
    return Response.json(
      { database: "error", persistent: false, message: e instanceof Error ? e.message : "Check failed" },
      { status: 500 }
    );
  }
}
