# Vercel: enable Setup and persistent data

On Vercel, the app needs **Redis** so "Run setup" and all data (tables, staff, help requests) persist.

## Steps

1. Open your project on [Vercel](https://vercel.com) → **gafesync-cafe-help**.
2. Go to **Storage** (tab in the project).
3. Click **Create Database** → choose **Upstash Redis** (or Redis from the marketplace).
4. Create the database and **connect it to this project** (Vercel will add the env vars).
5. **Redeploy**: Deployments → ⋮ on latest deployment → **Redeploy**.

Then open **https://gafesync-cafe-help.vercel.app/admin** and click **Run setup**. Tables and staff will be saved.

## Local development

No Redis needed locally. The app uses a file (`data/store.json`) when `KV_REST_API_URL` is not set.
