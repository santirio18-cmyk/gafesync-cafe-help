"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function TableHelpPage() {
  const params = useParams();
  const tableNumber = Number(params?.number);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const needHelp = async () => {
    if (!tableNumber || tableNumber < 1) {
      setMessage("Invalid table.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("");
    const maxAttempts = 3;
    const delayMs = 1500;
    let lastError = "";
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch("/api/help", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tableNumber }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage("🎲 Your Game Guru is on the way!");
          setStatus("success");
          return;
        }
        if (res.status === 503 && data?.code === "DATABASE_NOT_CONFIGURED") {
          setMessage("The cafe is configuring the system. Please ask a staff member for help in the meantime.");
          setStatus("success");
          return;
        }
        lastError = data?.error || "Something went wrong.";
      } catch {
        lastError = "Connection failed.";
      }
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    setMessage(
      "Your table is noted. A Game Guru will join you shortly. If no one arrives in a couple of minutes, wave or ask at the counter—we're here to assist."
    );
    setStatus("success");
  };

  if (!tableNumber || tableNumber < 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gamesync-pattern p-5">
        <p className="text-[#57534e]">Invalid table.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gamesync-pattern">
      <header className="w-full bg-[var(--bg-header)] flex flex-col items-center pt-5 pb-4 px-4 shadow-md border-b border-white/10">
        <Image
          src="/logo.png"
          alt="GameSync Cafe"
          width={300}
          height={126}
          className="object-contain"
        />
        <p className="text-white/90 text-lg font-light tracking-widest mt-2">Gamers On Board</p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[380px] rounded-[20px] bg-white py-10 px-8 shadow-xl border border-[var(--logo-accent)]/10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#1c1917] mb-1">Welcome to GameSync Cafe</h1>
            <p className="text-[#78716c] text-sm font-medium">Table {tableNumber}</p>
          </div>

          <button
            onClick={needHelp}
            disabled={status === "loading"}
            className="btn-call-guru w-full rounded-2xl bg-[var(--logo-accent)] text-white font-bold text-lg py-5 px-6 hover:bg-[var(--logo-accent-dim)] disabled:opacity-60 transition-all duration-150 active:scale-[0.98]"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Calling your Guru…
              </span>
            ) : (
              "Call Game Guru"
            )}
          </button>

          <p className="text-[#78716c] text-xs text-center mt-4">
            Rules explained • Game suggestions • Setup assistance
          </p>

          {message && (
            <div
              className={`mt-8 p-5 rounded-2xl text-center text-sm font-medium ${
                status === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
