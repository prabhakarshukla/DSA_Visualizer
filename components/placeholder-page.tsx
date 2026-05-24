import Link from "next/link";

type PlaceholderPageProps = {
  title: string;
  message?: string;
};

export function PlaceholderPage({ title, message = "This visualizer will be added soon." }: PlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-8 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
        <Link href="/" className="text-sm font-medium text-[#556B2F] transition hover:text-[#4B5320]">
          &larr; Back to homepage
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#4B5320]">{title}</h1>
        <p className="mt-3 text-[#556B2F]">{message}</p>
      </div>
    </main>
  );
}
