"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function AdminPage() {
  const [tables, setTables] = useState<{ id: string; number: number }[]>([]);
  const [setupDone, setSetupDone] = useState(false);
  const [namedStaffCreated, setNamedStaffCreated] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [qrDataUrls, setQrDataUrls] = useState<Record<number, string>>({});

  const [connectionError, setConnectionError] = useState("");

  useEffect(() => {
    if (!baseUrl || tables.length === 0) return;
    let cancelled = false;
    const load = async () => {
      const QR = await import("qrcode").then((m) => m.default);
      const next: Record<number, string> = {};
      for (const t of tables) {
        if (cancelled) return;
        try {
          next[t.number] = await QR.toDataURL(`${baseUrl}/table/${t.number}`, { width: 180, margin: 1 });
        } catch {
          // skip
        }
      }
      if (!cancelled) setQrDataUrls(next);
    };
    load();
    return () => { cancelled = true; };
  }, [baseUrl, tables]);

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
              if (Array.isArray(data.created)) setNamedStaffCreated(data.created.some((c: string) => c.startsWith("staff user: ")));
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

  const getPrintSheetHtml = () => {
    const tableNumbers = tables.map((t) => t.number).sort((a, b) => a - b);
    if (tableNumbers.length === 0) return "";
    const cards = tableNumbers
      .map(
        (n) =>
          `<div class="card">
            <p class="card-title">Table ${n}</p>
            <img src="${qrDataUrls[n] || ""}" alt="Table ${n}" width="180" height="180" />
            <p class="card-url">${baseUrl}/table/${n}</p>
          </div>`
      )
      .join("");
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>GameSync Cafe – QR codes for print</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 16px; color: #1c1917; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; max-width: 800px; margin: 0 auto; }
  .card { border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; text-align: center; page-break-inside: avoid; }
  .card-title { font-weight: 600; margin: 0 0 12px 0; font-size: 18px; }
  .card img { display: block; margin: 0 auto 8px; }
  .card-url { font-size: 11px; color: #78716c; word-break: break-all; margin: 0; }
  @media print { body { padding: 0; } .card { box-shadow: none; } }
</style>
</head>
<body>
  <h1 style="text-align:center;margin-bottom:24px">GameSync Cafe – Table QR codes</h1>
  <div class="grid">${cards}</div>
  <p style="text-align:center;margin-top:24px;font-size:12px;color:#78716c">Print this page and cut out each QR code for your tables.</p>
</body>
</html>`;
  };

  const openPrintSheet = () => {
    const html = getPrintSheetHtml();
    if (!html) return;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  const downloadPrintSheet = () => {
    const html = getPrintSheetHtml();
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gamesync-cafe-qr-codes.html";
    a.click();
    URL.revokeObjectURL(url);
  };

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
        if (Array.isArray(data.created)) setNamedStaffCreated(data.created.some((c: string) => c.startsWith("staff user: ")));
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
              <p className="text-[#57534e] text-sm mb-4">Click once to create tables 1–10 and staff accounts. After that, your QR codes are ready—paste them at tables and they work forever. (Runs automatically if the list is empty.)</p>
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
              {namedStaffCreated && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-amber-800 font-medium text-sm mb-1">Named staff accounts created</p>
                  <p className="text-amber-900 text-sm">Each has a unique password set during setup. Share them securely with each person (e.g. in person); passwords are not shown here for security.</p>
                </div>
              )}
            </div>
          )}

          {tables.length > 0 && (
            <div className="space-y-6">
              <section className="rounded-2xl bg-white p-4 shadow-sm border border-[var(--logo-accent)]/10">
                <p className="text-[#57534e] text-sm">
                  Request summary (daily counts, who accepted what) is on the{" "}
                  <a href="/game-guru/login" className="text-[var(--logo-accent)] hover:underline font-medium">Game Guru dashboard</a>.
                  Each staff sees their own accepted requests; admin sees everyone’s.
                </p>
              </section>

              {baseUrl && (
                <div className="rounded-xl bg-[#fff7ed] border border-[#ffedd5] px-4 py-3 text-sm text-[#9a3412]">
                  {baseUrl.includes("vercel.app") || baseUrl.startsWith("https://") ? (
                    <>Customers can scan these QR codes from any phone (cafe WiFi, mobile data, any network).</>
                  ) : (
                    <>You&apos;re running locally. Customers on a different network won&apos;t be able to open these links. <strong>For your cafe:</strong> use the QR codes from your live site (e.g. deploy to Vercel) so customers can scan from any network.</>
                  )}
                </div>
              )}
              <div className="mb-4 flex flex-wrap gap-3 items-center">
                <button
                  type="button"
                  onClick={openPrintSheet}
                  disabled={tables.length === 0 || Object.keys(qrDataUrls).length < tables.length}
                  className="rounded-xl bg-[var(--logo-accent)] text-white font-medium py-2.5 px-4 hover:bg-[var(--logo-accent-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Open print sheet
                </button>
                <button
                  type="button"
                  onClick={downloadPrintSheet}
                  disabled={tables.length === 0 || Object.keys(qrDataUrls).length < tables.length}
                  className="rounded-xl bg-white border-2 border-[var(--logo-accent)] text-[var(--logo-accent)] font-medium py-2.5 px-4 hover:bg-[#fff7ed] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Download as file
                </button>
              </div>
              <p className="text-[#57534e] text-sm mb-4">Use <strong>Open print sheet</strong> then Print (Ctrl+P / Cmd+P) or Save as PDF. Use <strong>Download as file</strong> to get an HTML file you can share (e.g. in chat)—open it in a browser to print.</p>
              <div className="grid gap-5 sm:grid-cols-2">
                {tables.map((t) => (
                  <div key={t.id} className="rounded-2xl bg-white p-5 shadow-sm border border-[var(--logo-accent)]/10">
                    <p className="text-[#1c1917] font-medium text-center mb-3">Table {t.number}</p>
                    <div className="flex justify-center">
                      <QRCode value={`${baseUrl}/table/${t.number}`} size={140} dataUrl={qrDataUrls[t.number]} />
                    </div>
                    <p className="mt-3 break-all text-center text-xs text-[#78716c]">
                      {baseUrl}/table/{t.number}
                    </p>
                  </div>
                ))}
              </div>
              <div className="text-sm text-[#78716c] space-y-1">
                <p>Game Guru login: <a href="/game-guru/login" className="text-[#c2410c] hover:underline">/game-guru/login</a></p>
                <p>User IDs: <strong>sanajay</strong>, <strong>arvind</strong>, <strong>chiti</strong>, <strong>ashok</strong>, <strong>bivish</strong> (each has a unique password; share securely, not shown on screen)</p>
                <p className="text-[#57534e] mt-2 text-xs">On the live site (Vercel): add <strong>Redis</strong> once (Storage → Upstash, then redeploy) so tables and staff are saved permanently. Your QR codes and links stay the same either way.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QRCode({ value, size, dataUrl: dataUrlProp }: { value: string; size: number; dataUrl?: string }) {
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  useEffect(() => {
    if (dataUrlProp) return;
    import("qrcode").then((QR) => {
      QR.toDataURL(value, { width: size, margin: 1 }).then(setLocalUrl);
    });
  }, [value, size, dataUrlProp]);
  const dataUrl = dataUrlProp || localUrl;
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
