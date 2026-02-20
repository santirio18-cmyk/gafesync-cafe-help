# GafeSync Cafe — Table Help Tool

Each table has a number and a QR code. When a customer scans the QR code, they see a **Need Help** button. When they tap it, all **active staff** (logged in on the staff dashboard) get notified and can mark **I'm attending**.

## Quick start

1. **Install and run**
   ```bash
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

2. **First-time setup**
   - Go to **Admin** ([/admin](http://localhost:3000/admin)).
   - Click **Run setup** to create tables 1–8 and a default staff account.
   - Default staff login: **staff** / **gafesync123**.

3. **Print QR codes**
   - On the Admin page, QR codes for each table are shown.
   - Print the page (or each table’s card) and stick one QR on each table.
   - Each QR links to `yoursite.com/table/1`, `yoursite.com/table/2`, etc.

4. **Staff**
   - Staff go to **Staff login** ([/staff/login](http://localhost:3000/staff/login)) and log in.
   - They keep the **Staff** dashboard open ([/staff](http://localhost:3000/staff)).
   - When a customer taps “Need Help”, a new request appears on the dashboard.
   - Any active staff can click **I'm attending** to mark it and go to the table.

## Pages

| Page | Who | Purpose |
|------|-----|--------|
| `/` | Anyone | Home with links to Staff login and Admin |
| `/table/[number]` | Customers | Opened by scanning table QR; “Need Help” button |
| `/staff/login` | Staff | Log in |
| `/staff` | Staff | Dashboard: pending help requests, “I’m attending” |
| `/admin` | You | Setup (tables + default staff), view/print QR codes |

## Data

- Tables, help requests, staff, and sessions are stored in `data/store.json` (created on first use).
- Staff stay “active” while they have the staff dashboard open (heartbeat every minute). After ~5 minutes without a heartbeat they are no longer considered active.

## Optional: add more staff

Right now the only way to add staff is via the setup API (default user). You can add an “Add staff” form in Admin and call a new API that uses `createStaff` from `lib/store.ts` with a bcrypt-hashed password.

## Deploy

- Run `npm run build` then `npm start`, or deploy to Vercel/Railway etc.
- For production, set `SETUP_SECRET` in the environment and pass it in the body when calling `POST /api/setup` so only you can run setup.
