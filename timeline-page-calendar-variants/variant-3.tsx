const entries = [
  { id: 1, action: "Sleep", color: "#818cf8", startMin: 0, durationMin: 440, title: "Offline / sleep" },
  { id: 2, action: "Morning", color: "#fbbf24", startMin: 440, durationMin: 50, title: "Coffee, planning, messages" },
  { id: 3, action: "Deep Work", color: "#6ee7b7", startMin: 490, durationMin: 155, title: "Proposal outline and architecture cleanup" },
  { id: 4, action: "Break", color: "#fb7185", startMin: 645, durationMin: 20, title: "Coffee and short walk" },
  { id: 5, action: "Planning", color: "#93c5fd", startMin: 665, durationMin: 75, title: "Timeline calendar redesign notes" },
  { id: 6, action: "Admin", color: "#f0abfc", startMin: 790, durationMin: 50, title: "Invoices and messages" },
  { id: 7, action: "Deep Work", color: "#6ee7b7", startMin: 840, durationMin: 110, title: "Implementation pass" }
];

const topMin = 950;
const dayHeight = 620;
const hourMarks = [0, 120, 240, 360, 480, 600, 720, 840, 950];

function y(min: number) {
  return dayHeight - (min / topMin) * dayHeight;
}

export function TimelinePageCalendarVariant3() {
  return (
    <main className="space-y-4">
      <section className="rounded-[22px] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.045)_0px,rgba(255,255,255,0.045)_1px,transparent_1px,transparent_9px),linear-gradient(135deg,rgba(38,92,255,0.26),rgba(7,9,16,0.9))] p-px">
        <div className="rounded-[21px] border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 backdrop-blur-xl">
          <h2 className="text-lg font-semibold leading-tight text-white">Saturday, May 23</h2>
          <p className="mt-1 text-xs text-white/55">Glass agenda canvas</p>
        </div>
      </section>
      <section className="rounded-[22px] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.045)_0px,rgba(255,255,255,0.045)_1px,transparent_1px,transparent_9px),linear-gradient(135deg,rgba(38,92,255,0.20),rgba(7,9,16,0.9))] p-px">
        <div className="grid grid-cols-[58px_1fr] gap-3 rounded-[21px] border border-white/[0.08] bg-white/[0.06] p-4 backdrop-blur-xl">
          <div className="relative" style={{ height: dayHeight }}>
            {hourMarks.map((mark) => <div key={mark} className="absolute right-0 text-[10px] font-medium text-white/35" style={{ top: y(mark) - 7 }}>{mark === topMin ? "Now" : `${Math.floor(mark / 60).toString().padStart(2, "0")}:00`}</div>)}
          </div>
          <div className="relative overflow-hidden rounded-[14px] border border-white/[0.08] bg-black/18" style={{ height: dayHeight }}>
            {hourMarks.map((mark) => <div key={mark} className="absolute left-0 right-0 border-t border-white/[0.07]" style={{ top: y(mark) }} />)}
            {entries.map((entry) => (
              <article key={entry.id} className="absolute left-2 right-2 rounded-[7px] border border-white/[0.08] px-3 py-2 backdrop-blur" style={{ bottom: `${entry.startMin / topMin * dayHeight}px`, height: `${Math.max(entry.durationMin / topMin * dayHeight, 24)}px`, backgroundColor: `${entry.color}24` }}>
                <div className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: entry.color }} />
                <strong className="truncate text-xs font-semibold text-white">{entry.action}</strong>
                {entry.durationMin > 36 ? <p className="mt-1 truncate text-[11px] text-white/55">{entry.title}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
