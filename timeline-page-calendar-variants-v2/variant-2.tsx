const entries = [
  { id: 1, action: "Sleep", color: "#818cf8", startMin: 0, durationMin: 440, title: "Offline / sleep" },
  { id: 2, action: "Morning", color: "#fbbf24", startMin: 440, durationMin: 50, title: "Coffee, planning, messages" },
  { id: 3, action: "Focus", color: "#6ee7b7", startMin: 490, durationMin: 155, title: "Proposal outline and architecture cleanup" },
  { id: 4, action: "Break", color: "#fb7185", startMin: 645, durationMin: 20, title: "Coffee and short walk" },
  { id: 5, action: "Plan", color: "#93c5fd", startMin: 665, durationMin: 75, title: "Timeline calendar redesign notes" },
  { id: 6, action: "Admin", color: "#f0abfc", startMin: 790, durationMin: 50, title: "Invoices and messages" },
  { id: 7, action: "Focus", color: "#6ee7b7", startMin: 840, durationMin: 110, title: "Implementation pass" }
];

const topMin = 950;
const dayHeight = 620;
const marks = [0, 120, 240, 360, 480, 600, 720, 840, 950];

function y(min: number) {
  return dayHeight - (min / topMin) * dayHeight;
}

export function TimelinePageCalendarV2Variant2() {
  return (
    <section className="rounded-[18px] bg-[#080b12]/92 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
      <div className="grid grid-cols-[52px_1fr] gap-3">
        <div className="relative" style={{ height: dayHeight }}>
          {marks.map((mark) => <div key={mark} className="absolute right-0 font-mono text-[10px] font-bold text-white/30" style={{ top: y(mark) - 7 }}>{mark === topMin ? "Now" : `${String(Math.floor(mark / 60)).padStart(2, "0")}:00`}</div>)}
        </div>
        <div className="relative overflow-hidden rounded-[6px] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.065)_1px,transparent_1px)] bg-[length:100%_39px] pr-20" style={{ height: dayHeight }}>
          {entries.map((entry) => {
            const compact = entry.durationMin < 34;
            return (
              <div key={entry.id}>
                <article className="absolute left-1.5 right-20 overflow-hidden rounded-[3px] border px-2 py-1.5" style={{ bottom: `${entry.startMin / topMin * dayHeight}px`, height: `${Math.max(entry.durationMin / topMin * dayHeight, 16)}px`, backgroundColor: `${entry.color}24`, borderColor: `${entry.color}5c` }}>
                  <div className="absolute inset-x-0 bottom-0 h-[3px]" style={{ backgroundColor: entry.color }} />
                  <strong className="truncate text-xs font-semibold">{compact ? entry.action[0] : entry.action}</strong>
                  {!compact && entry.durationMin > 42 ? <p className="truncate text-[11px] text-white/48">{entry.title}</p> : null}
                </article>
                {compact ? <div className="absolute right-1 flex h-5 items-center gap-1 rounded-[3px] bg-black/35 px-1.5 text-[10px] font-semibold text-white/72" style={{ bottom: `${entry.startMin / topMin * dayHeight}px` }}><span className="size-1.5" style={{ backgroundColor: entry.color }} />{entry.action}</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
