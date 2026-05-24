const entries = [
  { id: 1, action: "Sleep", color: "#818cf8", start: "00:00", startMin: 0, durationMin: 440, title: "Offline / sleep", active: false },
  { id: 2, action: "Morning", color: "#fbbf24", start: "07:20", startMin: 440, durationMin: 50, title: "Coffee, planning, messages", active: false },
  { id: 3, action: "Deep Work", color: "#6ee7b7", start: "08:10", startMin: 490, durationMin: 155, title: "Proposal outline and architecture cleanup", active: false },
  { id: 4, action: "Break", color: "#fb7185", start: "10:45", startMin: 645, durationMin: 20, title: "Coffee and short walk", active: false },
  { id: 5, action: "Planning", color: "#93c5fd", start: "11:05", startMin: 665, durationMin: 75, title: "Timeline calendar redesign notes", active: false },
  { id: 6, action: "Admin", color: "#f0abfc", start: "13:10", startMin: 790, durationMin: 50, title: "Invoices and messages", active: false },
  { id: 7, action: "Deep Work", color: "#6ee7b7", start: "14:00", startMin: 840, durationMin: 110, title: "Implementation pass", active: true }
];

const topMin = 950;
const dayHeight = 620;
const hourMarks = [0, 120, 240, 360, 480, 600, 720, 840, 950];

function label(min: number) {
  if (min === topMin) return "Now 15:50";
  return `${Math.floor(min / 60).toString().padStart(2, "0")}:${(min % 60).toString().padStart(2, "0")}`;
}

function y(min: number) {
  return dayHeight - (min / topMin) * dayHeight;
}

export function TimelinePageCalendarVariant1() {
  return (
    <main className="space-y-4">
      <section className="rounded-[21px] border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 backdrop-blur-xl">
        <h2 className="text-lg font-semibold leading-tight text-white">Saturday, May 23</h2>
        <p className="mt-1 text-xs text-white/55">6h 50m tracked</p>
      </section>
      <section className="rounded-[22px] border border-white/8 bg-white/[0.035] p-4">
        <div className="grid grid-cols-[56px_1fr] gap-3">
          <div className="relative" style={{ height: dayHeight }}>
            {hourMarks.map((mark) => <div key={mark} className="absolute right-0 text-[10px] font-medium text-white/35" style={{ top: y(mark) - 7 }}>{label(mark)}</div>)}
          </div>
          <div className="relative overflow-hidden rounded-[12px] border border-white/[0.08] bg-black/20" style={{ height: dayHeight }}>
            {hourMarks.map((mark) => <div key={mark} className="absolute left-0 right-0 border-t border-white/[0.07]" style={{ top: y(mark) }} />)}
            {entries.map((entry) => (
              <article key={entry.id} className="absolute left-2 right-2 rounded-md border px-3 py-2 shadow-sm" style={{ bottom: `${entry.startMin / topMin * dayHeight}px`, height: `${Math.max(entry.durationMin / topMin * dayHeight, 22)}px`, borderColor: `${entry.color}66`, backgroundColor: `${entry.color}24` }}>
                <div className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: entry.color }} />
                <strong className="truncate text-xs font-semibold text-white">{entry.action}</strong>
                {entry.durationMin > 28 ? <p className="mt-1 truncate text-[11px] text-white/52">{entry.title}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
