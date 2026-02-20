import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 p-6">
      <main className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-stone-800">GafeSync Cafe</h1>
        <p className="mt-2 text-stone-600">Board game cafe — table help</p>
        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/staff/login"
            className="rounded-xl bg-amber-500 px-6 py-3 font-medium text-white hover:bg-amber-600"
          >
            Staff login
          </Link>
          <Link
            href="/admin"
            className="rounded-xl border border-amber-500 px-6 py-3 font-medium text-amber-700 hover:bg-amber-50"
          >
            Admin — QR codes &amp; setup
          </Link>
        </div>
      </main>
    </div>
  );
}
