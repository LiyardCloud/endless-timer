const entries = [
  { id: 1, action: "Deep Work", color: "#6ee7b7", start: "08:10", end: "10:45", duration: "2h 35m", title: "Proposal outline and architecture cleanup", active: false },
  { id: 2, action: "Break", color: "#fbbf24", start: "10:45", end: "11:05", duration: "20m", title: "Coffee and short walk", active: false },
  { id: 3, action: "Planning", color: "#93c5fd", start: "11:05", end: "12:20", duration: "1h 15m", title: "Timeline calendar redesign notes", active: false },
  { id: 4, action: "Admin", color: "#fda4af", start: "13:10", end: "14:00", duration: "50m", title: "Invoices and messages", active: false },
  { id: 5, action: "Deep Work", color: "#6ee7b7", start: "14:00", end: "Now", duration: "1h 42m", title: "Implementation pass", active: true }
];

export function TimelineCalendarVariant1() {
  return (
    <section className="rounded-lg bg-[#f8fafc] p-5 text-slate-950 shadow-sm">
      <div className="mb-5 flex items-end justify-between border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Saturday</p>
          <h2 className="text-3xl font-semibold">May 23</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Tracked</p>
          <p className="text-lg font-semibold">6h 42m</p>
        </div>
      </div>
      <div className="grid grid-cols-[54px_1fr] gap-x-4">
        {entries.map((entry) => (
          <div className="contents" key={entry.id}>
            <div className="pt-4 text-right text-xs font-medium text-slate-400">{entry.start}</div>
            <article className="border-l border-slate-200 py-2 pl-4">
              <div className="rounded-md border border-slate-200 bg-white px-3 py-3 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <strong className="text-sm">{entry.action}</strong>
                      {entry.active ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Active</span> : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500">{entry.title}</p>
                  </div>
                  <p className="shrink-0 text-xs font-medium text-slate-500">{entry.duration}</p>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
