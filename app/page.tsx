import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gamesync-pattern">
      <header className="bg-[var(--logo-bg)] border-b-4 border-[var(--logo-accent)]">
        <div className="flex justify-center py-5 px-4">
          <Image
            src="/logo.png"
            alt="GameSync — Gamers on-board"
            width={220}
            height={92}
            className="object-contain"
            priority
          />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        <p className="text-[#57534e] text-center text-lg max-w-sm mb-10">
          Table help for your board game cafe. Game Gurus get notified when customers need assistance.
        </p>
        <div className="w-full max-w-xs flex flex-col gap-3">
          <Link
            href="/game-guru/login"
            className="block w-full text-center rounded-xl bg-[#c2410c] text-white font-medium py-3.5 px-5 hover:bg-[#9a3412] transition-colors"
          >
            Game Guru login
          </Link>
          <Link
            href="/admin"
            className="block w-full text-center rounded-xl border border-[#d6d3d1] bg-white text-[#1c1917] font-medium py-3.5 px-5 hover:bg-[#fafaf9] transition-colors"
          >
            Admin — QR codes &amp; setup
          </Link>
        </div>
      </main>
    </div>
  );
}
