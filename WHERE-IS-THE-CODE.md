# Where is the code? — GameSync

All the code is inside this folder: **gafesync-cafe-help**

Open this folder in Cursor (File → Open Folder → choose `gafesync-cafe-help`), then use the **Explorer** on the left to open any file and see the code.

---

## Folder map

```
gafesync-cafe-help/
├── app/                          ← All pages and API
│   ├── page.tsx                  ← Home page (Staff login & Admin links)
│   ├── layout.tsx                ← Overall layout & title
│   ├── globals.css               ← Global styles
│   │
│   ├── table/[number]/page.tsx   ← Customer page: "Need Help" button (when they scan QR)
│   ├── staff/
│   │   ├── login/page.tsx        ← Staff login page
│   │   └── page.tsx              ← Staff dashboard (see requests, "I'm attending")
│   ├── admin/page.tsx            ← Admin: setup, QR codes
│   │
│   └── api/                      ← Backend (what runs when you click buttons)
│       ├── help/route.ts         ← Create help request (customer tapped "Need Help")
│       ├── help/[id]/attend/     ← Staff marks "I'm attending"
│       ├── tables/route.ts      ← List/add tables
│       ├── setup/route.ts        ← Run setup (create tables + staff user)
│       └── staff/
│           ├── login/route.ts   ← Staff login
│           ├── logout/route.ts
│           ├── me/route.ts       ← Who is logged in
│           ├── heartbeat/route.ts
│           └── active/route.ts
│
├── lib/                          ← Shared logic & data
│   ├── store.ts                  ← Data: tables, help requests, staff (saved in data/store.json)
│   └── auth.ts                   ← Read staff login cookie
│
├── data/                         ← Created when you run the app (not in git)
│   └── store.json                ← All saved data (tables, staff, requests)
│
├── package.json                  ← Project name and scripts (npm run dev, etc.)
├── README.md                     ← How to use the app
└── WHERE-IS-THE-CODE.md          ← This file
```

---

## Files to open first (to see the code)

1. **app/page.tsx** — Home page (the first screen you see).
2. **app/table/[number]/page.tsx** — The "Need Help" page customers see when they scan the QR.
3. **app/staff/page.tsx** — Staff dashboard (pending requests).
4. **lib/store.ts** — Where tables, staff, and help requests are saved and loaded.

In Cursor: press **Cmd+P** (Mac) or **Ctrl+P** (Windows), type the file name (e.g. `page.tsx`), press Enter to open it.
