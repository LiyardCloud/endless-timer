const entries = [
  { id: 1, action: "Deep Work", color: "#6ee7b7", start: "08:10", end: "10:45", startMin: 10, durationMin: 155, title: "Proposal outline and architecture cleanup" },
  { id: 2, action: "Break", color: "#fbbf24", start: "10:45", end: "11:05", startMin: 165, durationMin: 20, title: "Coffee and short walk" },
  { id: 3, action: "Planning", color: "#93c5fd", start: "11:05", end: "12:20", startMin: 185, durationMin: 75, title: "Timeline calendar redesign notes" },
  { id: 4, action: "Admin", color: "#fda4af", start: "13:10", end: "14:00", startMin: 310, durationMin: 50, title: "Invoices and messages" },
  { id: 5, action: "Deep Work", color: "#6ee7b7", start: "14:00", end: "Now", startMin: 360, durationMin: 110, title: "Implementation pass" }
];

const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const hourHeight = 52;
const dayHeight = hourHeight * (hours.length - 1);

export function TimelineHourCalendarVariant2() {
  return (
    <section className="rounded-[18px] bg-[#0f1117] p-4 text-white shadow-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold leading-tight">May 23 / Day Plan</h2>
        <div className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-xs font-medium text-white/65">5 blocks</div>
      </div>
      <div className="grid grid-cols-[46px_1fr] gap-3">
        <div className="relative" style={{ height: dayHeight }}>
          {hours.slice(0, -1).map((hour, index) => <div key={hour} className="absolute right-0 font-mono text-[10px] font-bold text-white/35" style={{ top: index * hourHeight }}>{hour}</div>)}
        </div>
        <div className="relative overflow-hidden rounded-sm border-2 border-white/20 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.11)_1px,transparent_1px)] bg-[length:100%_52px]" style={{ height: dayHeight }}>
          {entries.map((entry, index) => (
            <article key={entry.id} className="absolute left-2 right-2 border-2 border-black p-2 text-black shadow-[4px_4px_0_rgba(255,255,255,0.18)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#bef264]" style={{ top: `${entry.startMin / 60 * hourHeight}px`, height: `${Math.max(entry.durationMin / 60 * hourHeight, 32)}px`, backgroundColor: entry.color }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-black">{entry.start} - {entry.end}</p>
                  <h3 className="truncate text-sm font-black uppercase">{entry.action}</h3>
                  {entry.durationMin > 45 ? <p className="mt-0.5 truncate text-[11px] font-semibold text-black/65">{entry.title}</p> : null}
                </div>
                <span className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-black bg-white text-[10px] font-black">{index + 1}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
