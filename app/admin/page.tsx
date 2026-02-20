"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [tables, setTables] = useState<{ id: string; number: number }[]>([]);
  const [setupDone, setSetupDone] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");

  const [connectionError, setConnectionError] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
    setConnectionError("");
    fetch("/api/tables")
      .then((r) => r.json())
      .then((data) => setTables(Array.isArray(data) ? data : []))
      .catch(() => {
        setTables([]);
        setConnectionError("Connection failed. Start the server with: npm run dev");
      });
  }, []);

  const runSetup = async () => {
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffUsername: "staff", staffPassword: "gafesync123" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSetupDone(true);
        setTables(await fetch("/api/tables").then((r) => r.json()));
      } else {
        alert(data.error || "Setup failed");
      }
    } catch {
      setConnectionError("Connection failed. Start the server with: npm run dev");
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold text-stone-800">GafeSync Cafe — Admin</h1>
        <p className="mb-6 text-stone-600">Set up tables and print QR codes for each table.</p>

        {connectionError && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-800">
            {connectionError}
          </div>
        )}
        {tables.length === 0 && !connectionError && (
          <div className="mb-6 rounded-xl bg-amber-50 p-4">
            <p className="mb-2 text-amber-800">No tables yet. Run setup to create default tables (1–8) and a staff account.</p>
            <button
              onClick={runSetup}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              Run setup
            </button>
            {setupDone && <p className="mt-2 text-sm text-green-700">Done. Default login: staff / gafesync123</p>}
          </div>
        )}

        {tables.length > 0 && (
          <div className="space-y-6">
            <p className="text-stone-600">
              Paste the QR code on each table. When customers scan it, they can tap &quot;Need Help&quot; and logged-in staff will see the request.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {tables.map((t) => (
                <div key={t.id} className="rounded-xl bg-white p-4 shadow">
                  <p className="mb-2 text-center font-semibold text-stone-800">Table {t.number}</p>
                  <div className="flex justify-center">
                    <QRCode value={`${baseUrl}/table/${t.number}`} size={160} />
                  </div>
                  <p className="mt-2 break-all text-center text-xs text-stone-500">
                    {baseUrl}/table/{t.number}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-stone-500">
              Staff login: <a href="/staff/login" className="text-amber-600 underline">/staff/login</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function QRCode({ value, size }: { value: string; size: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    import("qrcode").then((QR) => {
      QR.toDataURL(value, { width: size, margin: 1 }).then(setDataUrl);
    });
  }, [value, size]);
  if (!dataUrl) return <div className="h-40 w-40 animate-pulse rounded bg-stone-200" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={`QR for table ${value.split("/").pop()}`}
      width={size}
      height={size}
    />
  );
}
