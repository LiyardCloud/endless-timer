const entries = [
  { id: 1, action: "Deep Work", icon: "Focus", color: "#6ee7b7", start: "08:10", startMin: 10, durationMin: 155, title: "Proposal outline and architecture cleanup" },
  { id: 2, action: "Break", icon: "Pause", color: "#fbbf24", start: "10:45", startMin: 165, durationMin: 20, title: "Coffee and short walk" },
  { id: 3, action: "Planning", icon: "Plan", color: "#93c5fd", start: "11:05", startMin: 185, durationMin: 75, title: "Timeline calendar redesign notes" },
  { id: 4, action: "Admin", icon: "Inbox", color: "#fda4af", start: "13:10", startMin: 310, durationMin: 50, title: "Invoices and messages" },
  { id: 5, action: "Deep Work", icon: "Focus", color: "#6ee7b7", start: "14:00", startMin: 360, durationMin: 110, title: "Implementation pass" }
];

const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const hourHeight = 52;
const dayHeight = hourHeight * (hours.length - 1);

export function TimelineHourCalendarVariant3() {
  return (
    <section className="rounded-[22px] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.045)_0px,rgba(255,255,255,0.045)_1px,transparent_1px,transparent_9px),linear-gradient(135deg,rgba(38,92,255,0.26),rgba(7,9,16,0.9))] p-px">
      <div className="rounded-[21px] border border-white/[0.08] bg-white/[0.06] p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold leading-tight text-white">Today</h2>
          <div className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-xs font-medium text-white/65">08:10 to now</div>
        </div>
        <div className="grid grid-cols-[48px_1fr] gap-3">
          <div className="relative" style={{ height: dayHeight }}>
            {hours.slice(0, -1).map((hour, index) => <div key={hour} className="absolute right-0 text-[11px] font-medium text-white/35" style={{ top: index * hourHeight }}>{hour}</div>)}
          </div>
          <div className="relative overflow-hidden rounded-[18px] border border-white/[0.08] bg-black/20" style={{ height: dayHeight }}>
            {hours.map((hour, index) => <div key={hour} className="absolute left-0 right-0 border-t border-white/[0.07]" style={{ top: index * hourHeight }} />)}
            {entries.map((entry) => (
              <article key={entry.id} className="absolute left-2 right-2 rounded-[14px] border border-white/[0.10] bg-white/[0.09] px-3 py-2 backdrop-blur transition hover:bg-white/[0.13]" style={{ top: `${entry.startMin / 60 * hourHeight}px`, height: `${Math.max(entry.durationMin / 60 * hourHeight, 34)}px`, boxShadow: `inset 3px 0 0 ${entry.color}` }}>
                <div className="flex items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold text-black" style={{ backgroundColor: entry.color }}>{entry.icon.slice(0, 1)}</span>
                  <strong className="truncate text-xs font-semibold text-white">{entry.action}</strong>
                </div>
                {entry.durationMin > 35 ? <p className="mt-1 truncate text-[11px] text-white/55">{entry.title}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
