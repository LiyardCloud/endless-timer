const entries = [
  { id: 1, action: "Sleep", icon: "S", color: "#818cf8", start: "00:00", startMin: 0, durationMin: 440, title: "Offline / sleep" },
  { id: 2, action: "Morning", icon: "M", color: "#fbbf24", start: "07:20", startMin: 440, durationMin: 50, title: "Coffee, planning, messages" },
  { id: 3, action: "Focus", icon: "F", color: "#6ee7b7", start: "08:10", startMin: 490, durationMin: 155, title: "Proposal outline and architecture cleanup" },
  { id: 4, action: "Break", icon: "B", color: "#fb7185", start: "10:45", startMin: 645, durationMin: 20, title: "Coffee and short walk" },
  { id: 5, action: "Plan", icon: "P", color: "#93c5fd", start: "11:05", startMin: 665, durationMin: 75, title: "Timeline calendar redesign notes" },
  { id: 6, action: "Admin", icon: "A", color: "#f0abfc", start: "13:10", startMin: 790, durationMin: 50, title: "Invoices and messages" },
  { id: 7, action: "Focus", icon: "F", color: "#6ee7b7", start: "14:00", startMin: 840, durationMin: 110, title: "Implementation pass" }
];

const topMin = 950;
const dayHeight = 620;
const marks = [0, 120, 240, 360, 480, 600, 720, 840, 950];

function y(min: number) {
  return dayHeight - (min / topMin) * dayHeight;
}

function label(min: number) {
  if (min === topMin) return "Now";
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:00`;
}

export function TimelinePageCalendarV2Variant1() {
  return (
    <section className="rounded-[18px] bg-[#080b12]/92 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
      <div className="grid grid-cols-[52px_1fr] gap-3">
        <div className="relative" style={{ height: dayHeight }}>
          {marks.map((mark) => <div key={mark} className="absolute right-0 font-mono text-[10px] font-bold text-white/30" style={{ top: y(mark) - 7 }}>{label(mark)}</div>)}
        </div>
        <div className="relative overflow-hidden rounded-[6px] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.065)_1px,transparent_1px)] bg-[length:100%_39px]" style={{ height: dayHeight }}>
          {entries.map((entry) => {
            const compact = entry.durationMin < 32;
            return (
              <article key={entry.id} className="absolute left-1.5 right-1.5 overflow-hidden rounded-[3px] border px-2 py-1.5 transition hover:z-10 hover:ring-2 hover:ring-white/10" style={{ bottom: `${entry.startMin / topMin * dayHeight}px`, height: `${Math.max(entry.durationMin / topMin * dayHeight, 18)}px`, backgroundColor: `${entry.color}24`, borderColor: `${entry.color}5c` }}>
                <div className="absolute inset-x-0 bottom-0 h-[3px]" style={{ backgroundColor: entry.color }} />
                {compact ? (
                  <div className="flex h-full items-center gap-2">
                    <span className="grid size-4 place-items-center text-[9px] font-black text-black" style={{ backgroundColor: entry.color }}>{entry.icon}</span>
                    <span className="text-[10px] font-semibold text-white/78">{entry.start}</span>
                  </div>
                ) : (
                  <>
                    <strong className="truncate text-xs font-semibold">{entry.action}</strong>
                    {entry.durationMin > 42 ? <p className="truncate text-[11px] text-white/48">{entry.title}</p> : null}
                  </>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
