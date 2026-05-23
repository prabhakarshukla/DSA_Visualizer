import Link from "next/link";

export default function PriorityQueuePlaceholderPage() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/queue" className="text-blue-700 hover:text-blue-800">&larr; Back to Queue overview</Link>
          <Link href="/" className="text-blue-700 hover:text-blue-800">Back to homepage</Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Priority Queue Visualizer</h1>
          <p className="mt-3 text-slate-600">Understand how queue processing changes when priority decides dequeue order.</p>
          <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">Priority queue visualizer coming soon.</p>
        </section>
      </div>
    </main>
  );
}
