# GameSync — Table Help Tool

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
   - Click **Run setup** to create tables 1–10 and a default staff account.
   - Default staff login: **staff** / **gamesync123**.

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

## Put on GitHub

1. **Create a new repo on GitHub**
   - Go to [github.com](https://github.com) and sign in.
   - Click the **+** (top right) → **New repository**.
   - Name it e.g. `gafesync-cafe-help`.
   - Leave “Add a README” **unchecked** (you already have one).
   - Click **Create repository**.

2. **Push your code** (run these in the project folder):
   ```bash
   cd /Users/santhoshpremkumar/gafesync-cafe-help
   git remote add origin https://github.com/YOUR_USERNAME/gafesync-cafe-help.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your GitHub username. If GitHub asks for a password, use a **Personal Access Token** (Settings → Developer settings → Personal access tokens).

After that, your project is on GitHub. You can later connect it to Vercel/Netlify to get a live link so you don’t need to run `npm run dev` yourself.

## Deploy

- Run `npm run build` then `npm start`, or deploy to Vercel/Railway etc.
- For production, set `SETUP_SECRET` in the environment and pass it in the body when calling `POST /api/setup` so only you can run setup.
