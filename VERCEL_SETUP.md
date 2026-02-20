# Set up database (Redis) on Vercel

The app uses **Upstash Redis** so tables, staff, help requests, and setup data persist across deployments and instances.

## 1. Create the database

1. Go to [vercel.com](https://vercel.com) and open your **gafesync-cafe-help** project.
2. Open the **Storage** tab.
3. Click **Create Database**.
4. Select **Upstash Redis** (or **Redis** from the marketplace).
5. Name it (e.g. `gafesync-store`) and pick a region close to your users.
6. Click **Create**.

## 2. Connect it to your project

1. After the database is created, open it.
2. Go to the **.env** or **Connect Project** section.
3. Select your **gafesync-cafe-help** project and connect it.  
   Vercel will add these environment variables to the project:
   - `KV_REST_API_URL` (or `UPSTASH_REDIS_REST_URL`)
   - `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_TOKEN`)

The app reads both naming conventions, so either is fine.

## 3. Redeploy

1. Go to the **Deployments** tab.
2. Open the **⋮** menu on the latest deployment.
3. Click **Redeploy** (so the new env vars are used).

## 4. Run setup once

1. Open **https://gafesync-cafe-help.vercel.app/admin** (or your live URL).
2. Click **Run setup** (or let auto-setup run if the list is empty).

Tables 1–8 and all staff accounts (admin, staff, and the 5 Game Gurus) will be stored in Redis. After that, data persists and you don’t need to run setup again.

---

**Optional:** In **Settings → Environment Variables** you can add **SESSION_SECRET** (a long random string) to sign login cookies more securely in production.

**Local development:** No Redis needed. The app uses `data/store.json` when Redis env vars are not set.
