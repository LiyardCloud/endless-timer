const entries = [
  { id: 1, action: "Sleep", color: "#818cf8", start: "00:00", startMin: 0, durationMin: 440 },
  { id: 2, action: "Morning", color: "#fbbf24", start: "07:20", startMin: 440, durationMin: 50 },
  { id: 3, action: "Deep Work", color: "#6ee7b7", start: "08:10", startMin: 490, durationMin: 155 },
  { id: 4, action: "Break", color: "#fb7185", start: "10:45", startMin: 645, durationMin: 20 },
  { id: 5, action: "Planning", color: "#93c5fd", start: "11:05", startMin: 665, durationMin: 75 },
  { id: 6, action: "Admin", color: "#f0abfc", start: "13:10", startMin: 790, durationMin: 50 },
  { id: 7, action: "Deep Work", color: "#6ee7b7", start: "14:00", startMin: 840, durationMin: 110 }
];

const topMin = 950;
const dayHeight = 620;
const hourMarks = [0, 120, 240, 360, 480, 600, 720, 840, 950];

function y(min: number) {
  return dayHeight - (min / topMin) * dayHeight;
}

export function TimelinePageCalendarVariant4() {
  return (
    <main className="space-y-4">
      <section className="rounded-[21px] border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 backdrop-blur-xl">
        <h2 className="text-lg font-semibold leading-tight text-white">Saturday, May 23</h2>
        <p className="mt-1 text-xs text-white/55">Split by action lanes</p>
      </section>
      <section className="rounded-[22px] border border-white/8 bg-white/[0.035] p-4">
        <div className="mb-3 grid grid-cols-[58px_repeat(4,minmax(0,1fr))] gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          <span />
          {["Sleep", "Focus", "Break", "Admin"].map((lane) => <span key={lane} className="truncate">{lane}</span>)}
        </div>
        <div className="grid grid-cols-[58px_1fr] gap-2">
          <div className="relative" style={{ height: dayHeight }}>
            {hourMarks.map((mark) => <div key={mark} className="absolute right-0 text-[10px] font-medium text-white/35" style={{ top: y(mark) - 7 }}>{mark === topMin ? "Now" : `${Math.floor(mark / 60).toString().padStart(2, "0")}:00`}</div>)}
          </div>
          <div className="relative grid grid-cols-4 overflow-hidden rounded-[10px] border border-white/[0.08] bg-black/20" style={{ height: dayHeight }}>
            {[0, 1, 2, 3].map((lane) => <div key={lane} className="border-r border-white/[0.055] last:border-r-0" />)}
            <div className="absolute inset-0">
              {hourMarks.map((mark) => <div key={mark} className="absolute left-0 right-0 border-t border-white/[0.07]" style={{ top: y(mark) }} />)}
              {entries.map((entry) => {
                const lane = entry.action === "Sleep" ? 0 : entry.action === "Deep Work" || entry.action === "Planning" ? 1 : entry.action === "Break" || entry.action === "Morning" ? 2 : 3;
                return (
                  <article key={entry.id} className="absolute rounded-[6px] border px-2 py-1.5" style={{ bottom: `${entry.startMin / topMin * dayHeight}px`, height: `${Math.max(entry.durationMin / topMin * dayHeight, 22)}px`, left: `calc(${lane * 25}% + 4px)`, width: "calc(25% - 8px)", borderColor: `${entry.color}66`, backgroundColor: `${entry.color}24` }}>
                    <div className="absolute inset-x-0 bottom-0 h-[3px]" style={{ backgroundColor: entry.color }} />
                    <strong className="block truncate text-[11px] font-semibold text-white">{entry.action}</strong>
                    {entry.durationMin > 42 ? <span className="block truncate text-[10px] text-white/45">{entry.start}</span> : null}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
