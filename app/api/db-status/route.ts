import { getTables } from "@/lib/store";

/**
 * GET /api/db-status — Check if the database (Redis) is working.
 * Returns store stats; if tables persist after setup, Redis is in use.
 */
export async function GET() {
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    const hasRedisEnv = !!(redisUrl && redisToken);

    const tables = await getTables();
    const { getHelpRequests } = await import("@/lib/store");
    const requests = await getHelpRequests(false);
    const { getStaffByUsername } = await import("@/lib/store");
    const hasStaff = !!(await getStaffByUsername("admin"));

    return Response.json({
      database: hasRedisEnv ? "Redis (configured)" : "memory or file",
      tablesCount: tables.length,
      helpRequestsCount: requests.length,
      hasStaff: hasStaff,
      message:
        hasRedisEnv && tables.length > 0
          ? "Database is working. Data is persisting in Redis."
          : hasRedisEnv
            ? "Redis is configured. Run Setup from Admin to create tables and staff."
            : "No Redis env vars set. Using in-memory or file store.",
    });
  } catch (e) {
    return Response.json(
      { database: "error", message: e instanceof Error ? e.message : "Check failed" },
      { status: 500 }
    );
  }
}
