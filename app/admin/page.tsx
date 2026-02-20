"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function AdminPage() {
  const [tables, setTables] = useState<{ id: string; number: number }[]>([]);
  const [setupDone, setSetupDone] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");

  const [connectionError, setConnectionError] = useState("");

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
            if (res.ok) setTables(await fetch("/api/tables").then((r) => r.json()));
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
          <p className="text-[#57534e] text-sm mb-6">Create tables and print QR codes for each table.</p>

          {connectionError && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {connectionError}
            </div>
          )}

          {tables.length === 0 && !connectionError && (
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-[#e7e5e4]">
              <p className="text-[#1c1917] font-medium mb-2">No tables yet</p>
              <p className="text-[#57534e] text-sm mb-4">Setup runs automatically when you open this page. If it didn’t, click below. Creates tables 1–8 and staff (admin / admin123, sanajay, arvind, chiti, ashok, bivish / gamesync123).</p>
              <button
                onClick={runSetup}
                className="rounded-xl bg-[#c2410c] text-white font-medium py-2.5 px-4 hover:bg-[#9a3412] transition-colors"
              >
                Run setup
              </button>
              {setupDone && (
                <p className="mt-3 text-sm text-green-700">
                  Done. Logins: staff / gamesync123 · admin / admin123 · sanajay, arvind, chiti, ashok, bivish / gamesync123
                </p>
              )}
            </div>
          )}

          {tables.length > 0 && (
            <div className="space-y-6">
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
                  <div key={t.id} className="rounded-2xl bg-white p-5 shadow-sm border border-[#e7e5e4]">
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
                <p>Staff login: <a href="/staff/login" className="text-[#c2410c] hover:underline">/staff/login</a></p>
                <p>User IDs: <strong>sanajay</strong>, <strong>arvind</strong>, <strong>chiti</strong>, <strong>ashok</strong>, <strong>bivish</strong> (password: gamesync123)</p>
                <p className="text-amber-700 mt-2">If you have to run setup again after refresh: the app is using temporary storage. Add <strong>Redis</strong> in Vercel (Storage → Upstash) and redeploy so data persists and you only setup once.</p>
              </div>
            </div>
          )}
        </div>
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
