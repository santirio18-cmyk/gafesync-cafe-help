"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type HelpRequest = {
  id: string;
  tableNumber: number;
  requestedAt: string;
  status: string;
  attendedAt?: string;
  attendedByName?: string;
};

type StaffMe = { id: string; username: string; displayName: string } | null;

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = 0.55;

    const playNote = (freq: number, start: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(masterGain);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.015);
      gain.gain.setValueAtTime(vol, start + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };

    const E6 = 1318.5;
    const G6 = 1568;
    const B6 = 1975.5;
    const E7 = 2637;
    const step = 0.16;
    playNote(E6, 0, step * 2.2, 0.9);
    playNote(G6, step * 0.4, step * 2.2, 0.85);
    playNote(B6, step * 0.85, step * 2.2, 0.85);
    playNote(E7, step * 1.3, step * 2.5, 1);
  } catch {
    // ignore
  }
}

function showBrowserNotification(tableNumber: number) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification("GameSync — Help requested", {
      body: `Table ${tableNumber} needs help`,
      icon: "/logo.png",
    });
  }
}

export default function GameGuruDashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [staff, setStaff] = useState<StaffMe>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myAccepted, setMyAccepted] = useState<HelpRequest[]>([]);
  const [allRequests, setAllRequests] = useState<HelpRequest[]>([]);
  const [summarySortBy, setSummarySortBy] = useState<"date" | "table">("date");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const previousIdsRef = useRef<Set<string>>(new Set());
  const hasFetchedOnce = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = useCallback(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    Notification.requestPermission().then((p) => setNotificationPermission(p));
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/help?pending=true");
      if (res.status === 401) {
        router.push("/game-guru/login");
        return;
      }
      const data = await res.json();
      const newRequests = Array.isArray(data) ? data : [];
      const newIds = new Set(newRequests.map((r: HelpRequest) => r.id));
      if (hasFetchedOnce.current) {
        const prev = previousIdsRef.current;
        newRequests.forEach((r: HelpRequest) => {
          if (!prev.has(r.id)) {
            playNotificationSound();
            showBrowserNotification(r.tableNumber);
          }
        });
      }
      previousIdsRef.current = newIds;
      hasFetchedOnce.current = true;
      setRequests(newRequests);
      setError("");
    } catch {
      setError("Connection failed. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetch("/api/staff/me")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/game-guru/login");
          return;
        }
        if (r.ok) {
          const data = await r.json();
          setStaff(data);
          setIsAdmin(data?.username === "admin");
        }
      })
      .catch(() => {
        setError("Connection failed. Start the server with: npm run dev");
      });
  }, [router]);

  const fetchMyAccepted = useCallback(async () => {
    if (!staff?.id) return;
    const res = await fetch("/api/help?mine=true");
    if (res.ok) {
      const data = await res.json();
      setMyAccepted(Array.isArray(data) ? data : []);
    }
  }, [staff?.id]);

  useEffect(() => {
    fetchMyAccepted();
  }, [fetchMyAccepted]);

  useEffect(() => {
    if (!isAdmin) {
      setAllRequests([]);
      return;
    }
    fetch("/api/help")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setAllRequests(Array.isArray(data) ? data : []))
      .catch(() => setAllRequests([]));
  }, [isAdmin]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 3000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  useEffect(() => {
    const heartbeat = () =>
      fetch("/api/staff/heartbeat", { method: "POST" }).catch(() => {});
    heartbeat();
    const interval = setInterval(heartbeat, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const attend = async (id: string) => {
    try {
      const res = await fetch(`/api/help/${id}/attend`, { method: "POST" });
      if (res.status === 401) {
        router.push("/game-guru/login");
        return;
      }
      if (res.ok) {
        await fetchRequests();
        await fetchMyAccepted();
        if (isAdmin) {
          const r = await fetch("/api/help");
          if (r.ok) {
            const data = await r.json();
            setAllRequests(Array.isArray(data) ? data : []);
          }
        }
      }
    } catch {
      setError("Could not mark as attended");
    }
  };

  const logout = async () => {
    await fetch("/api/staff/logout", { method: "POST" });
    router.push("/game-guru/login");
    router.refresh();
  };

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <p className="text-[#57534e]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gamesync-pattern">
      <header className="flex items-center justify-between bg-[var(--logo-bg)] border-b-4 border-[var(--logo-accent)] px-4 py-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="GameSync" className="h-9 w-auto object-contain" />
        <span className="text-sm font-medium text-[#1c1917]">
          {staff ? (
            <>Game Guru · Welcome, {staff.displayName || staff.username}</>
          ) : (
            "Game Guru"
          )}
        </span>
        <button
          onClick={logout}
          className="text-sm font-medium text-[#c2410c] hover:text-[#9a3412] transition-colors"
        >
          Log out
        </button>
      </header>
      <div className="flex-1 p-5">
        <div className="mx-auto max-w-xl">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-[var(--logo-accent)]/10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-[#1c1917] font-semibold text-base">Help requests</h2>
              {typeof window !== "undefined" && "Notification" in window && notificationPermission !== "granted" && (
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="text-xs text-[#78716c] hover:text-[#1c1917] underline"
                >
                  {notificationPermission === "denied" ? "Notifications blocked" : "Enable notifications"}
                </button>
              )}
            </div>
            {requests.length === 0 ? (
              <p className="text-[#78716c] text-sm py-4">No pending requests. New requests will appear here automatically.</p>
            ) : (
              <ul className="space-y-2">
                {requests.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-xl bg-[#fff7ed] border border-[#ffedd5] p-4"
                  >
                    <div>
                      <span className="font-medium text-[#1c1917]">Table {r.tableNumber}</span>
                      <span className="ml-2 text-sm text-[#78716c]">
                        {new Date(r.requestedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <button
                      onClick={() => attend(r.id)}
                      className="rounded-lg bg-[var(--logo-accent)] text-white text-sm font-medium py-2 px-4 hover:bg-[var(--logo-accent-dim)] transition-colors"
                    >
                      I’m attending
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm border border-[var(--logo-accent)]/10">
            <h2 className="text-[#1c1917] font-semibold text-base mb-1">Your accepted requests</h2>
            <p className="text-[#57534e] text-sm mb-4">What you’ve attended and when.</p>
            {myAccepted.length === 0 ? (
              <p className="text-[#78716c] text-sm py-4">None yet. When you tap “I’m attending” on a request, it will show here.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#e7e5e4] text-left text-[#57534e]">
                      <th className="py-2 pr-4 font-medium">Table #</th>
                      <th className="py-2 pr-4 font-medium">Raised at</th>
                      <th className="py-2 font-medium">Accepted at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...myAccepted]
                      .sort((a, b) => (b.attendedAt || b.requestedAt).localeCompare(a.attendedAt || a.requestedAt))
                      .map((r) => (
                        <tr key={r.id} className="border-b border-[#e7e5e4]/60">
                          <td className="py-2 pr-4">{r.tableNumber}</td>
                          <td className="py-2 pr-4 whitespace-nowrap">{formatTime(r.requestedAt)}</td>
                          <td className="py-2 whitespace-nowrap">{r.attendedAt ? formatTime(r.attendedAt) : "—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {isAdmin && (
            <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm border border-[var(--logo-accent)]/10">
              <h2 className="text-[#1c1917] font-semibold text-base mb-1">Request summary (all staff)</h2>
              <p className="text-[#57534e] text-sm mb-4">
                {allRequests.length} total request{allRequests.length !== 1 ? "s" : ""}. Daily count; sort by date or table.
              </p>
              {allRequests.length === 0 ? (
                <p className="text-[#78716c] text-sm py-4">No requests yet.</p>
              ) : (
                <>
                  <div className="mb-4 p-3 rounded-xl bg-[#faf9f7] border border-[#e7e5e4]">
                    <p className="text-[#1c1917] font-medium text-sm mb-2">Requests per day</p>
                    <DailyCounts requests={allRequests} />
                  </div>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setSummarySortBy("date")}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${summarySortBy === "date" ? "bg-[var(--logo-accent)] text-white" : "bg-[#e7e5e4] text-[#57534e]"}`}
                    >
                      Date wise
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummarySortBy("table")}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${summarySortBy === "table" ? "bg-[var(--logo-accent)] text-white" : "bg-[#e7e5e4] text-[#57534e]"}`}
                    >
                      Table wise
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-[#e7e5e4] text-left text-[#57534e]">
                          {summarySortBy === "date" && <th className="py-2 pr-4 font-medium">Date</th>}
                          <th className="py-2 pr-4 font-medium">Table #</th>
                          <th className="py-2 pr-4 font-medium">Raised at</th>
                          <th className="py-2 pr-4 font-medium">Accepted at</th>
                          <th className="py-2 font-medium">By whom</th>
                        </tr>
                      </thead>
                      <tbody>
                        <RequestSummaryRows requests={allRequests} sortBy={summarySortBy} />
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

function getDateKey(iso: string): string {
  return iso.slice(0, 10);
}
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

function DailyCounts({ requests }: { requests: HelpRequest[] }) {
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

function RequestSummaryRows({ requests, sortBy }: { requests: HelpRequest[]; sortBy: "date" | "table" }) {
  const sorted = [...requests].sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
  const grouped: Record<string, HelpRequest[]> =
    sortBy === "date"
      ? sorted.reduce<Record<string, HelpRequest[]>>((acc, r) => {
          const key = getDateKey(r.requestedAt);
          if (!acc[key]) acc[key] = [];
          acc[key].push(r);
          return acc;
        }, {})
      : sorted.reduce<Record<string, HelpRequest[]>>((acc, r) => {
          const key = String(r.tableNumber);
          if (!acc[key]) acc[key] = [];
          acc[key].push(r);
          return acc;
        }, {});

  const rows: { groupLabel: string; items: HelpRequest[] }[] =
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
            <td className="py-2 pr-4 whitespace-nowrap">{r.attendedAt ? formatTime(r.attendedAt) : "—"}</td>
            <td className="py-2">{r.attendedByName ?? "—"}</td>
          </tr>
        ))
      )}
    </>
  );
}
