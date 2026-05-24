const entries = [
  { id: 1, action: "Deep Work", icon: "Focus", color: "#6ee7b7", start: "08:10", duration: "2h 35m", title: "Proposal outline and architecture cleanup", active: false },
  { id: 2, action: "Break", icon: "Pause", color: "#fbbf24", start: "10:45", duration: "20m", title: "Coffee and short walk", active: false },
  { id: 3, action: "Planning", icon: "Plan", color: "#93c5fd", start: "11:05", duration: "1h 15m", title: "Timeline calendar redesign notes", active: false },
  { id: 4, action: "Admin", icon: "Inbox", color: "#fda4af", start: "13:10", duration: "50m", title: "Invoices and messages", active: false },
  { id: 5, action: "Deep Work", icon: "Focus", color: "#6ee7b7", start: "14:00", duration: "1h 42m", title: "Implementation pass", active: true }
];

export function TimelineCalendarVariant3() {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_left,#5eead4,transparent_35%),radial-gradient(circle_at_bottom_right,#818cf8,transparent_36%),linear-gradient(135deg,#101827,#05060b)] p-5 text-white">
      <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-white/50">Calendar board</p>
            <h2 className="text-2xl font-semibold">Today</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/70">08:10 - now</div>
        </div>
        <div className="grid gap-2">
          {entries.map((entry) => (
            <article key={entry.id} className="grid grid-cols-[72px_1fr] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] backdrop-blur transition hover:bg-white/[0.12]">
              <div className="border-r border-white/10 bg-black/15 p-3">
                <p className="text-sm font-semibold">{entry.start}</p>
                <p className="mt-1 text-[11px] text-white/45">{entry.duration}</p>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full text-[10px] font-bold text-black" style={{ backgroundColor: entry.color }}>{entry.icon.slice(0, 1)}</span>
                  <strong className="text-sm">{entry.action}</strong>
                  {entry.active ? <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-emerald-200">Active</span> : null}
                </div>
                <p className="mt-2 text-sm leading-5 text-white/62">{entry.title}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
