const entries = [
  { id: 1, action: "Deep Work", color: "#6ee7b7", start: "08:10", startMin: 10, durationMin: 155, title: "Proposal outline and architecture cleanup", active: false },
  { id: 2, action: "Break", color: "#fbbf24", start: "10:45", startMin: 165, durationMin: 20, title: "Coffee and short walk", active: false },
  { id: 3, action: "Planning", color: "#93c5fd", start: "11:05", startMin: 185, durationMin: 75, title: "Timeline calendar redesign notes", active: false },
  { id: 4, action: "Admin", color: "#fda4af", start: "13:10", startMin: 310, durationMin: 50, title: "Invoices and messages", active: false },
  { id: 5, action: "Deep Work", color: "#6ee7b7", start: "14:00", startMin: 360, durationMin: 110, title: "Implementation pass", active: true }
];

const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const hourHeight = 52;
const dayHeight = hourHeight * (hours.length - 1);

export function TimelineHourCalendarVariant1() {
  return (
    <section className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-slate-950 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Saturday</p>
          <h2 className="text-lg font-semibold leading-tight">May 23</h2>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">6h 50m</div>
      </div>
      <div className="grid grid-cols-[52px_1fr] gap-3">
        <div className="relative" style={{ height: dayHeight }}>
          {hours.slice(0, -1).map((hour, index) => <div key={hour} className="absolute right-0 text-[11px] font-medium text-slate-400" style={{ top: index * hourHeight - 1 }}>{hour}</div>)}
        </div>
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white" style={{ height: dayHeight }}>
          {hours.map((hour, index) => <div key={hour} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: index * hourHeight }} />)}
          {entries.map((entry) => (
            <article key={entry.id} className="absolute left-2 right-2 rounded-lg border bg-white px-3 py-2 shadow-sm transition hover:z-10 hover:border-slate-300 hover:shadow-md" style={{ top: `${entry.startMin / 60 * hourHeight}px`, height: `${Math.max(entry.durationMin / 60 * hourHeight, 26)}px`, borderColor: `${entry.color}66`, backgroundColor: `${entry.color}14` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <strong className="truncate text-xs font-semibold">{entry.action}</strong>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{entry.title}</p>
                </div>
                <span className="shrink-0 text-[10px] font-medium text-slate-500">{entry.start}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
