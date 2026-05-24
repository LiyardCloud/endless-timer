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

export function TimelineHourCalendarVariant4() {
  return (
    <section className="bg-[#f5f1e7] p-4 text-black">
      <div className="mb-3 grid grid-cols-[1fr_auto] border-4 border-black bg-white">
        <div className="p-2">
          <p className="text-[10px] font-bold uppercase">Calendar sheet</p>
          <h2 className="text-2xl font-bold">Sat 23 May</h2>
        </div>
        <div className="border-l-4 border-black bg-[#facc15] p-2 text-right font-black">6h 50m</div>
      </div>
      <div className="grid grid-cols-[48px_1fr] gap-2">
        <div className="relative border-r-4 border-black" style={{ height: dayHeight }}>
          {hours.slice(0, -1).map((hour, index) => <div key={hour} className="absolute right-2 font-mono text-[10px] font-black" style={{ top: index * hourHeight }}>{hour}</div>)}
        </div>
        <div className="relative border-4 border-black bg-white" style={{ height: dayHeight }}>
          {hours.map((hour, index) => <div key={hour} className="absolute left-0 right-0 border-t-4 border-black/80" style={{ top: index * hourHeight }} />)}
          {entries.map((entry, index) => (
            <article key={entry.id} className={`absolute border-4 border-black p-2 shadow-[4px_4px_0_#000] transition hover:-translate-x-1 ${index % 2 ? "left-8 right-1" : "left-1 right-8"}`} style={{ top: `${entry.startMin / 60 * hourHeight}px`, height: `${Math.max(entry.durationMin / 60 * hourHeight, 34)}px`, backgroundColor: entry.color }}>
              <p className="font-mono text-[10px] font-black">{entry.start} - {entry.end}</p>
              <h3 className="truncate text-sm font-bold uppercase">{entry.action}</h3>
              {entry.durationMin > 40 ? <p className="truncate text-[11px] font-bold">{entry.title}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
