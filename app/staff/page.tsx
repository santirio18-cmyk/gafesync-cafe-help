"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type HelpRequest = {
  id: string;
  tableNumber: number;
  requestedAt: string;
  status: string;
};

export default function StaffDashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/help?pending=true");
      if (res.status === 401) {
        router.push("/staff/login");
        return;
      }
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("Connection failed. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetch("/api/staff/me")
      .then((r) => {
        if (r.status === 401) router.push("/staff/login");
      })
      .catch(() => {
        setError("Connection failed. Start the server with: npm run dev");
      });
  }, [router]);

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
        router.push("/staff/login");
        return;
      }
      if (res.ok) await fetchRequests();
    } catch {
      setError("Could not mark as attended");
    }
  };

  const logout = async () => {
    await fetch("/api/staff/logout", { method: "POST" });
    router.push("/staff/login");
    router.refresh();
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <p className="text-stone-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stone-800">GafeSync Cafe — Staff</h1>
          <button
            onClick={logout}
            className="rounded-lg bg-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-300"
          >
            Log out
          </button>
        </div>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-stone-800">Help requests</h2>
          {requests.length === 0 ? (
            <p className="text-stone-500">No pending requests. New requests will appear here.</p>
          ) : (
            <ul className="space-y-3">
              {requests.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl bg-amber-50 p-4"
                >
                  <div>
                    <span className="font-semibold text-stone-800">Table {r.tableNumber}</span>
                    <span className="ml-2 text-sm text-stone-500">
                      {new Date(r.requestedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    onClick={() => attend(r.id)}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                  >
                    I’m attending
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
