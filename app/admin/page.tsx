"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type HelpRequestRow = {
  id: string;
  tableNumber: number;
  requestedAt: string;
  status: string;
  attendedAt?: string;
  attendedByName?: string;
};

export default function AdminPage() {
  const [tables, setTables] = useState<{ id: string; number: number }[]>([]);
  const [setupDone, setSetupDone] = useState(false);
  const [staffPasswords, setStaffPasswords] = useState<Record<string, string> | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [requests, setRequests] = useState<HelpRequestRow[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "table">("date");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [connectionError, setConnectionError] = useState("");

  useEffect(() => {
    fetch("/api/staff/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setIsAdmin(data?.username === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    setConnectionError("");
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => setBaseUrl(data.qrBaseUrl || window.location.origin))
      .catch(() => setBaseUrl(window.location.origin));
    fetch("/api/tables")
      .then((r) => r.json())
      .then(async (data) => {
        const list = Array.isArray(data) ? data : [];
        setTables(list);
        if (list.length === 0) {
          try {
            const res = await fetch("/api/setup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ staffUsername: "staff", staffPassword: "gamesync123" }),
            });
            if (res.ok) {
              const data = await res.json();
              setTables(await fetch("/api/tables").then((r) => r.json()));
              if (data.staffPasswords) setStaffPasswords(data.staffPasswords);
            }
          } catch {
            // ignore; user can click Run setup
          }
        }
      })
      .catch(() => {
        setTables([]);
        setConnectionError("Connection failed. Start the server with: npm run dev");
      });
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setRequests([]);
      return;
    }
    fetch("/api/help")
      .then((r) => r.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setRequests([]));
  }, [isAdmin]);

  const runSetup = async () => {
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffUsername: "staff", staffPassword: "gamesync123" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSetupDone(true);
        setTables(await fetch("/api/tables").then((r) => r.json()));
        if (data.staffPasswords) setStaffPasswords(data.staffPasswords);
      } else {
        alert(data.error || "Setup failed");
      }
    } catch {
      setConnectionError("Connection failed. Start the server with: npm run dev");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f7]">
      <header className="flex items-center justify-between bg-[var(--logo-bg)] border-b-4 border-[var(--logo-accent)] px-4 py-3">
        <Image src="/logo.png" alt="GameSync" width={150} height={62} className="object-contain" />
        <span className="text-sm font-medium text-[#1c1917]">Admin</span>
        <span className="w-14" />
      </header>
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-[#1c1917] font-semibold text-lg mb-1">Setup & QR codes</h1>
          <p className="text-[#57534e] text-sm mb-6">One-time setup: create tables and staff. Print the QR codes and paste them at each table—those links are permanent and never change.</p>

          {connectionError && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {connectionError}
            </div>
          )}

          {tables.length === 0 && !connectionError && (
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-[var(--logo-accent)]/10">
              <p className="text-[#1c1917] font-medium mb-2">No tables yet</p>
              <p className="text-[#57534e] text-sm mb-4">Click once to create tables 1–8 and staff accounts. After that, your QR codes are ready—paste them at tables and they work forever. (Runs automatically if the list is empty.)</p>
              <button
                onClick={runSetup}
                className="rounded-xl bg-[var(--logo-accent)] text-white font-medium py-2.5 px-4 hover:bg-[var(--logo-accent-dim)] transition-colors"
              >
                Run setup
              </button>
              {setupDone && (
                <p className="mt-3 text-sm text-green-700">
                  Done. Game Guru login: /game-guru/login · admin / admin123 · staff / gamesync123
                </p>
              )}
              {staffPasswords && Object.keys(staffPasswords).length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-amber-800 font-medium text-sm mb-2">Named staff passwords (share securely with each person)</p>
                  <ul className="text-sm text-amber-900 font-mono space-y-1">
                    {Object.entries(staffPasswords).map(([user, pw]) => (
                      <li key={user}><strong>{user}</strong>: {pw}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {tables.length > 0 && (
            <div className="space-y-6">
              {/* Request summary — only for admin account */}
              {isAdmin === false && (
                <section className="rounded-2xl bg-white p-6 shadow-sm border border-[var(--logo-accent)]/10">
                  <p className="text-[#57534e] text-sm">
                    Request summary is only visible to the admin account.{" "}
                    <a href="/game-guru/login" className="text-[var(--logo-accent)] hover:underline font-medium">
                      Sign in as admin
                    </a>{" "}
                    to view daily counts and request details.
                  </p>
                </section>
              )}
              {isAdmin === true && (
                <section className="rounded-2xl bg-white p-6 shadow-sm border border-[var(--logo-accent)]/10">
                  <h2 className="text-[#1c1917] font-semibold text-base mb-1">Request summary</h2>
                  <p className="text-[#57534e] text-sm mb-4">
                    {requests.length} total request{requests.length !== 1 ? "s" : ""}. Daily count below; sort by date or table.
                  </p>
                  {requests.length === 0 ? (
                    <p className="text-[#78716c] text-sm py-4">No requests yet.</p>
                  ) : (
                    <>
                      <div className="mb-4 p-3 rounded-xl bg-[#faf9f7] border border-[#e7e5e4]">
                        <p className="text-[#1c1917] font-medium text-sm mb-2">Requests per day</p>
                        <DailyCounts requests={requests} />
                      </div>
                      <div className="flex gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setSortBy("date")}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${sortBy === "date" ? "bg-[var(--logo-accent)] text-white" : "bg-[#e7e5e4] text-[#57534e]"}`}
                        >
                          Date wise
                        </button>
                        <button
                          type="button"
                          onClick={() => setSortBy("table")}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${sortBy === "table" ? "bg-[var(--logo-accent)] text-white" : "bg-[#e7e5e4] text-[#57534e]"}`}
                        >
                          Table wise
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-[#e7e5e4] text-left text-[#57534e]">
                              {sortBy === "date" && <th className="py-2 pr-4 font-medium">Date</th>}
                              <th className="py-2 pr-4 font-medium">Table #</th>
                              <th className="py-2 pr-4 font-medium">Raised at</th>
                              <th className="py-2 pr-4 font-medium">Accepted at</th>
                              <th className="py-2 font-medium">By whom</th>
                            </tr>
                          </thead>
                          <tbody>
                            <RequestRows requests={requests} sortBy={sortBy} />
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </section>
              )}

              {baseUrl && (
                <div className="rounded-xl bg-[#fff7ed] border border-[#ffedd5] px-4 py-3 text-sm text-[#9a3412]">
                  {baseUrl.includes("vercel.app") || baseUrl.startsWith("https://") ? (
                    <>Customers can scan these QR codes from any phone (cafe WiFi, mobile data, any network).</>
                  ) : (
                    <>You&apos;re running locally. Customers on a different network won&apos;t be able to open these links. <strong>For your cafe:</strong> use the QR codes from your live site (e.g. deploy to Vercel) so customers can scan from any network.</>
                  )}
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                {tables.map((t) => (
                  <div key={t.id} className="rounded-2xl bg-white p-5 shadow-sm border border-[var(--logo-accent)]/10">
                    <p className="text-[#1c1917] font-medium text-center mb-3">Table {t.number}</p>
                    <div className="flex justify-center">
                      <QRCode value={`${baseUrl}/table/${t.number}`} size={140} />
                    </div>
                    <p className="mt-3 break-all text-center text-xs text-[#78716c]">
                      {baseUrl}/table/{t.number}
                    </p>
                  </div>
                ))}
              </div>
              <div className="text-sm text-[#78716c] space-y-1">
                <p>Game Guru login: <a href="/game-guru/login" className="text-[#c2410c] hover:underline">/game-guru/login</a></p>
                <p>User IDs: <strong>sanajay</strong>, <strong>arvind</strong>, <strong>chiti</strong>, <strong>ashok</strong>, <strong>bivish</strong> (each has a unique password)</p>
                {staffPasswords && Object.keys(staffPasswords).length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-amber-800 font-medium text-xs mb-1">Named staff passwords (share securely)</p>
                    <ul className="text-xs text-amber-900 font-mono space-y-0.5">
                      {Object.entries(staffPasswords).map(([user, pw]) => (
                        <li key={user}><strong>{user}</strong>: {pw}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[#57534e] mt-2 text-xs">On the live site (Vercel): add <strong>Redis</strong> once (Storage → Upstash, then redeploy) so tables and staff are saved permanently. Your QR codes and links stay the same either way.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getDateKey(iso: string): string {
  return iso.slice(0, 10);
}
function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

function DailyCounts({ requests }: { requests: HelpRequestRow[] }) {
  const byDay: Record<string, number> = {};
  requests.forEach((r) => {
    const key = getDateKey(r.requestedAt);
    byDay[key] = (byDay[key] || 0) + 1;
  });
  const days = Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0]));
  if (days.length === 0) return <p className="text-[#78716c] text-xs">No data</p>;
  return (
    <ul className="text-xs text-[#57534e] space-y-1">
      {days.map(([date, count]) => (
        <li key={date}>
          {formatDate(date + "T12:00:00")}: <strong>{count}</strong> request{count !== 1 ? "s" : ""}
        </li>
      ))}
    </ul>
  );
}

function RequestRows({ requests, sortBy }: { requests: HelpRequestRow[]; sortBy: "date" | "table" }) {
  const sorted = [...requests].sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
  const grouped: Record<string, HelpRequestRow[]> =
    sortBy === "date"
      ? sorted.reduce<Record<string, HelpRequestRow[]>>((acc, r) => {
          const key = getDateKey(r.requestedAt);
          if (!acc[key]) acc[key] = [];
          acc[key].push(r);
          return acc;
        }, {})
      : sorted.reduce<Record<string, HelpRequestRow[]>>((acc, r) => {
          const key = String(r.tableNumber);
          if (!acc[key]) acc[key] = [];
          acc[key].push(r);
          return acc;
        }, {});

  const rows: { groupLabel: string; items: HelpRequestRow[] }[] =
    sortBy === "date"
      ? Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, items]) => ({ groupLabel: formatDate(date + "T12:00:00"), items }))
      : Object.entries(grouped)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([table, items]) => ({ groupLabel: `Table ${table}`, items }));

  return (
    <>
      {rows.map(({ groupLabel, items }) =>
        items.map((r) => (
          <tr key={r.id} className="border-b border-[#e7e5e4]/60">
            {sortBy === "date" && (
              <td className="py-2 pr-4 text-[#57534e] whitespace-nowrap">{groupLabel}</td>
            )}
            <td className="py-2 pr-4">{r.tableNumber}</td>
            <td className="py-2 pr-4 whitespace-nowrap">{formatTime(r.requestedAt)}</td>
            <td className="py-2 pr-4 whitespace-nowrap">
              {r.attendedAt ? formatTime(r.attendedAt) : "—"}
            </td>
            <td className="py-2">{r.attendedByName ?? "—"}</td>
          </tr>
        ))
      )}
    </>
  );
}

function QRCode({ value, size }: { value: string; size: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    import("qrcode").then((QR) => {
      QR.toDataURL(value, { width: size, margin: 1 }).then(setDataUrl);
    });
  }, [value, size]);
  if (!dataUrl) return <div className="h-[140px] w-[140px] animate-pulse rounded-lg bg-[#e7e5e4]" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={`QR for table ${value.split("/").pop()}`}
      width={size}
      height={size}
      className="rounded-lg"
    />
  );
}
