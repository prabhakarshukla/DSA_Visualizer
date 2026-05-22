import Link from "next/link";

type PlaceholderPageProps = {
  title: string;
  message?: string;
};

export function PlaceholderPage({ title, message = "This visualizer will be added soon." }: PlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <Link href="/" className="text-sm font-medium text-blue-700 transition hover:text-blue-800">
          &larr; Back to homepage
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-3 text-slate-600">{message}</p>
      </div>
    </main>
  );
}
