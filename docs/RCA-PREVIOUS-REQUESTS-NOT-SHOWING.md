# RCA: Why previous requests do not show

## Summary

**Root cause:** Requests created **before Redis was connected** (or on a different environment) were stored only in **in-memory** storage. That data was never written to Redis and is **not recoverable**. The app does not filter or delete old requests; it shows everything that exists in Redis.

---

## End-to-end flow (verified)

### 1. Where data is stored

- **Single store key in Redis:** `gafesync:store` (see `lib/store.ts` → `KV_KEY`).
- One JSON object holds: `tables`, `helpRequests`, `staff`, `sessions`.
- **No TTL, no auto-delete:** Data stays until overwritten or the key is removed.

### 2. When a customer raises a request

- **Path:** Customer → table page → "Call Game Guru" → `POST /api/help` → `createHelpRequest(tableNumber)`.
- **Code:** `lib/store.ts` → `createHelpRequest()`:
  - Calls `load()` (Redis → get full store, or file, or **in-memory**).
  - Appends new item to `store.helpRequests`.
  - Calls `save(store)` (Redis → set full store, or file, or **in-memory**).
- **If Redis env vars are set:** `load()` and `save()` use Redis; data is shared across all requests and persists.
- **If Redis is not set (e.g. Vercel before env was added):** `load()`/`save()` use **in-memory** store. Each serverless instance has its **own** memory. So:
  - Request A is created on Instance 1 → stored in Instance 1’s memory.
  - Next request (e.g. admin opening dashboard) may run on Instance 2 → Instance 2’s memory is **empty** → admin sees 0 requests.
  - Instance 1’s memory is never written to Redis, so that data is **lost** when the instance is recycled.

### 3. When admin views “Request summary (all staff)”

- **Path:** Admin → Game Guru dashboard → `GET /api/help` (no query) → `getHelpRequests(false)`.
- **Code:** `lib/store.ts` → `getHelpRequests(onlyPending)`:
  - `const reqs = (await load()).helpRequests;`
  - Returns `onlyPending ? reqs.filter(r => r.status === "pending") : reqs` → **all requests**, no date or count limit.
- **API:** `app/api/help/route.ts` → for admin, returns `getHelpRequests(false)` → **entire** `helpRequests` array.
- **UI:** `app/game-guru/page.tsx` → uses `allRequests` as-is; daily counts and table are computed from **all** items. **No client-side filter by date.**

So: **whatever is in Redis is what is shown.** There is no code path that hides or deletes “previous” requests.

---

## Why “previous” requests are missing

| Scenario | Result |
|----------|--------|
| Requests created **before** Redis was configured on Vercel | Stored in in-memory only; lost when instance changed. **Never in Redis** → cannot appear. |
| Requests created on **localhost** | Stored in `data/store.json` or local memory. **Live app reads from Redis** → different store → they do not appear on live. |
| Requests created **after** Redis was configured and redeployed | Stored in Redis. **They do show** (as in your screenshot: 2 requests, 21 Feb 2026). |

So the “previous” requests you expect are almost certainly from **before Redis was connected** or from **another environment**. They were never written to the Redis database the live app uses today.

---

## Conclusion

- **No bug in “showing” logic:** The app loads the full `helpRequests` array from Redis and displays it without date or count limits.
- **Root cause:** Those earlier requests were created when the app was not persisting to Redis (or was using a different store). That data no longer exists in the current store and **cannot be recovered**.
- **Going forward:** All new requests created after Redis is configured and deployed will persist and show in “Request summary (all staff)” and “Your accepted requests” as designed.
