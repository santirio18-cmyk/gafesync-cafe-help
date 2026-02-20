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
    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      setMessage("Help is on the way! A staff member will be with you shortly.");
      setStatus("success");
    } catch {
      setMessage("Connection failed. Check your network or ask staff for help.");
      setStatus("error");
    }
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
      <header className="bg-[var(--logo-bg)] border-b-4 border-[var(--logo-accent)]">
        <div className="flex justify-center py-4 px-4">
          <Image
            src="/logo.png"
            alt="GameSync — Gamers on-board"
            width={200}
            height={84}
            className="object-contain"
          />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[380px] rounded-2xl bg-white p-8 shadow-xl border-2 border-[#ea580c]/30">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#1c1917] mb-1">Welcome to GameSync Cafe</h1>
            <p className="text-[#78716c] text-sm">Table {tableNumber}</p>
            <p className="text-[#57534e] text-xs mt-3 font-medium">
              Catan · Carcassonne · Ticket to Ride & more
            </p>
          </div>

          <p className="text-[#57534e] text-center text-sm mb-6 leading-relaxed">
            Need something? Tap below and our staff will come to your table.
          </p>

          <button
            onClick={needHelp}
            disabled={status === "loading"}
            className="w-full rounded-xl bg-[#ea580c] text-white font-bold text-lg py-4 px-6 hover:bg-[#c2410c] disabled:opacity-60 transition-all shadow-md hover:shadow-lg border-2 border-[#c2410c]/20"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending…
              </span>
            ) : (
              "Need Help"
            )}
          </button>

          {message && (
            <div
              className={`mt-5 p-4 rounded-xl text-center text-sm font-medium ${
                status === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : status === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-amber-50 text-[#57534e] border border-amber-200"
              }`}
            >
              {status === "success" && "✓ "}
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
