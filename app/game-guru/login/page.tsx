"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function GameGuruLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      router.push("/game-guru");
      router.refresh();
    } catch {
      setError("Connection failed. Make sure the server is running (npm run dev).");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f7]">
      <header className="flex justify-center bg-[var(--logo-bg)] border-b-4 border-[var(--logo-accent)] py-5">
        <Image
          src="/logo.png"
          alt="GameSync"
          width={180}
          height={75}
          className="object-contain"
        />
      </header>
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-[360px] rounded-2xl bg-white p-8 shadow-sm border border-[#e7e5e4]">
          <h1 className="text-[#1c1917] font-semibold text-lg text-center mb-1">Game Guru login</h1>
          <p className="text-[#78716c] text-sm text-center mb-6">Sign in to see help requests</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1c1917] mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-[#d6d3d1] bg-white px-3.5 py-2.5 text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:ring 2px focus:ring-[#c2410c]/30 focus:border-[#c2410c]"
                placeholder="Enter username"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1c1917] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#d6d3d1] bg-white px-3.5 py-2.5 text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:ring 2px focus:ring-[#c2410c]/30 focus:border-[#c2410c]"
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="space-y-1">
                <p className="text-sm text-red-600">{error}</p>
                {error.includes("Invalid") && (
                  <p className="text-xs text-[#78716c]">First time? Run Setup at Admin, or try admin / admin123</p>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#c2410c] text-white font-medium py-3 px-4 hover:bg-[#9a3412] disabled:opacity-60 transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
