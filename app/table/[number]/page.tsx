"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

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
      <div className="flex min-h-screen items-center justify-center bg-amber-50 p-4">
        <p className="text-lg text-amber-800">Invalid table.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <p className="mb-2 text-center text-sm font-medium text-amber-800">Table {tableNumber}</p>
        <h1 className="mb-6 text-center text-2xl font-bold text-stone-800">GafeSync Cafe</h1>
        <p className="mb-6 text-center text-stone-600">Need something? Tap below and our staff will come to your table.</p>
        <button
          onClick={needHelp}
          disabled={status === "loading"}
          className="w-full rounded-xl bg-amber-500 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-amber-600 disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : "Need Help"}
        </button>
        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              status === "success" ? "text-green-700" : status === "error" ? "text-red-700" : "text-stone-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
