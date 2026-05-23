export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Inventory Reservation System
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Database foundation ready
        </h1>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Products", "Warehouses", "Inventory", "Reservations"].map((item) => (
          <div key={item} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-medium text-slate-900">{item}</h2>
            <p className="mt-2 text-sm text-slate-600">Schema setup placeholder</p>
          </div>
        ))}
      </section>
    </main>
  );
}
