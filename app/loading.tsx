export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-9 w-72 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-slate-200" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-lg border border-slate-200 bg-white"
            />
          ))}
        </section>
        <aside className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white" />
      </div>
    </main>
  );
}
