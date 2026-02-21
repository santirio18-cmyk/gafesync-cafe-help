# User Acceptance Test (UAT) — GameSync Cafe

**App:** Table help / Game Guru  
**Environment:** Local (`http://localhost:3000`) or Live (e.g. `https://gafesync-cafe-help.vercel.app`)  
**Prerequisites:** Redis configured (live) or running locally with `npm run dev`

---

## Test run

| Run | Date | Environment | Result | Notes |
|-----|------|-------------|--------|-------|
| 1 | | Local / Live | Pass / Fail | |
| 2 | | | | |

---

## 1. Admin — Tables & QR codes

| # | Step | Expected result | Pass / Fail |
|---|------|-----------------|-------------|
| 1.1 | Open `/admin` | Page loads; header "Tables & QR codes". | |
| 1.2 | If DB empty | "Preparing…" then 10 table cards with QR codes and links. No "setup" wording. | |
| 1.3 | If DB has data | 10 table cards with QR codes immediately. | |
| 1.4 | Click "Open print sheet" | New tab opens with all 10 QR codes, 2 columns, table numbers and URLs. | |
| 1.5 | Click "Download as file" | File `gamesync-cafe-qr-codes.html` downloads. | |
| 1.6 | No red "Data is not being saved" banner | (Only if Redis is configured.) | |

---

## 2. Customer — Call Game Guru

| # | Step | Expected result | Pass / Fail |
|---|------|-----------------|-------------|
| 2.1 | Open table page (e.g. `/table/3`) | Page loads; "Call Game Guru" button and short copy (rules, suggestions, setup assistance). | |
| 2.2 | Tap "Call Game Guru" | Message: "Your Game Guru is on the way!" (or retry message if server busy). | |
| 2.3 | (Live, Redis not configured) Tap "Call Game Guru" | Friendly message: "The cafe is configuring the system. Please ask a staff member for help." | |

---

## 3. Game Guru — See and accept request

| # | Step | Expected result | Pass / Fail |
|---|------|-----------------|-------------|
| 3.1 | Open `/game-guru/login` | Login form; no "setup" in copy. | |
| 3.2 | Log in as staff (e.g. admin / admin123) | Redirect to `/game-guru`; header shows "Game Guru · Welcome, Admin". | |
| 3.3 | With a pending request from 2.x | "Help requests" card shows that request (table number, time) and "I'm attending" button. | |
| 3.4 | Tap "I'm attending" | Request disappears from "Help requests"; appears in "Your accepted requests" with Raised at, Accepted at. | |
| 3.5 | Refresh page (same session) | "Your accepted requests" still shows the request (data from Redis). | |
| 3.6 | Log out, log in again | First load shows "Your accepted requests" (no need to relogin to see data). | |

---

## 4. Admin — Request summary (all staff)

| # | Step | Expected result | Pass / Fail |
|---|------|-----------------|-------------|
| 4.1 | Log in as admin, open Game Guru dashboard | Section "Request summary (all staff)" visible. | |
| 4.2 | After at least one request created and accepted | Summary shows total count, daily count, table with Date, Table #, Raised at, Accepted at, By whom. | |
| 4.3 | Sort "Date wise" / "Table wise" | Table reorders correctly. | |
| 4.4 | Log in as non-admin (e.g. staff) | No "Request summary (all staff)" section. | |

---

## 5. Staff — Own activity (e.g. Sanajay)

| # | Step | Expected result | Pass / Fail |
|---|------|-----------------|-------------|
| 5.1 | Log in as a named staff (e.g. Sanajay with their password) | Dashboard shows "Your accepted requests". | |
| 5.2 | Accept a request ("I'm attending") | That request appears in "Your accepted requests" with table #, Raised at, Accepted at. | |
| 5.3 | Staff does not see other staff's accepted requests | Only their own list in "Your accepted requests". | |

---

## 6. Database (Redis) — Persistence

| # | Step | Expected result | Pass / Fail |
|---|------|-----------------|-------------|
| 6.1 | Open `/api/db-status` | JSON: `database: "Redis (configured)"`, `persistent: true` (on live with Redis). | |
| 6.2 | Create request, accept it, then refresh / relogin | Request and "By whom" still visible; counts match. | |
| 6.3 | (Live) No Redis | Red banner on Admin and Game Guru; 503 on create/attend with clear message. | |

---

## 7. Edge cases

| # | Step | Expected result | Pass / Fail |
|---|------|-----------------|-------------|
| 7.1 | Open invalid table (e.g. `/table/99`) | "Invalid table" or similar. | |
| 7.2 | Access `/game-guru` without login | Redirect to `/game-guru/login`. | |
| 7.3 | GET `/api/help` without admin session | 403 "Admin only". | |

---

## Sign-off

| Role | Name | Date | Pass / Fail |
|------|------|------|-------------|
| Tester | | | |
| Product / Owner | | | |

**Notes:**  
- Run against **live** after deploy and with Redis configured for real UAT.  
- Local run uses file/memory store; persistence and 503 behaviour differ from live.
