const entries = [
  { id: 1, action: "Sleep", color: "#818cf8", start: "00:00", startMin: 0, durationMin: 440, title: "Offline / sleep" },
  { id: 2, action: "Morning", color: "#fbbf24", start: "07:20", startMin: 440, durationMin: 50, title: "Coffee, planning, messages" },
  { id: 3, action: "Deep Work", color: "#6ee7b7", start: "08:10", startMin: 490, durationMin: 155, title: "Proposal outline and architecture cleanup" },
  { id: 4, action: "Break", color: "#fb7185", start: "10:45", startMin: 645, durationMin: 20, title: "Coffee and short walk" },
  { id: 5, action: "Planning", color: "#93c5fd", start: "11:05", startMin: 665, durationMin: 75, title: "Timeline calendar redesign notes" },
  { id: 6, action: "Admin", color: "#f0abfc", start: "13:10", startMin: 790, durationMin: 50, title: "Invoices and messages" },
  { id: 7, action: "Deep Work", color: "#6ee7b7", start: "14:00", startMin: 840, durationMin: 110, title: "Implementation pass" }
];

const topMin = 950;
const dayHeight = 620;
const hourMarks = [0, 120, 240, 360, 480, 600, 720, 840, 950];

function label(min: number) {
  if (min === topMin) return "Now";
  return `${Math.floor(min / 60).toString().padStart(2, "0")}:00`;
}

function y(min: number) {
  return dayHeight - (min / topMin) * dayHeight;
}

export function TimelinePageCalendarVariant2() {
  return (
    <main className="space-y-4">
      <section className="rounded-[21px] border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 backdrop-blur-xl">
        <h2 className="text-lg font-semibold leading-tight text-white">Saturday, May 23</h2>
        <p className="mt-1 text-xs text-white/55">Dense sharp blocks</p>
      </section>
      <section className="rounded-[22px] border border-white/8 bg-[#080b12]/92 p-4">
        <div className="grid grid-cols-[52px_1fr] gap-3">
          <div className="relative" style={{ height: dayHeight }}>
            {hourMarks.map((mark) => <div key={mark} className="absolute right-0 font-mono text-[10px] font-bold text-white/32" style={{ top: y(mark) - 7 }}>{label(mark)}</div>)}
          </div>
          <div className="relative overflow-hidden rounded-[8px] border border-white/[0.10] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[length:100%_39px]" style={{ height: dayHeight }}>
            {entries.map((entry) => (
              <article key={entry.id} className="absolute left-1.5 right-1.5 overflow-hidden rounded-[6px] border px-2 py-1.5" style={{ bottom: `${entry.startMin / topMin * dayHeight}px`, height: `${Math.max(entry.durationMin / topMin * dayHeight, 20)}px`, borderColor: `${entry.color}66`, backgroundColor: `${entry.color}24` }}>
                <div className="absolute inset-x-0 bottom-0 h-[3px]" style={{ backgroundColor: entry.color }} />
                <strong className="truncate text-xs font-semibold text-white">{entry.action}</strong>
                {entry.durationMin > 34 ? <p className="truncate text-[11px] text-white/48">{entry.title}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
