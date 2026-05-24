const entries = [
  { id: 1, action: "Deep Work", color: "#6ee7b7", start: "08:10", end: "10:45", duration: "2h 35m", title: "Proposal outline and architecture cleanup", active: false },
  { id: 2, action: "Break", color: "#fbbf24", start: "10:45", end: "11:05", duration: "20m", title: "Coffee and short walk", active: false },
  { id: 3, action: "Planning", color: "#93c5fd", start: "11:05", end: "12:20", duration: "1h 15m", title: "Timeline calendar redesign notes", active: false },
  { id: 4, action: "Admin", color: "#fda4af", start: "13:10", end: "14:00", duration: "50m", title: "Invoices and messages", active: false },
  { id: 5, action: "Deep Work", color: "#6ee7b7", start: "14:00", end: "Now", duration: "1h 42m", title: "Implementation pass", active: true }
];

export function TimelineCalendarVariant4() {
  return (
    <section className="bg-[#f4f1e8] p-4 text-black">
      <div className="mb-4 grid grid-cols-[1fr_auto] border-4 border-black bg-[#fffbeb]">
        <div className="p-3">
          <p className="text-xs font-bold uppercase">Daily ledger</p>
          <h2 className="text-3xl font-bold">SAT 23 MAY</h2>
        </div>
        <div className="border-l-4 border-black bg-[#facc15] p-3 text-right font-black">
          <p className="text-2xl">6:42</p>
          <p className="text-xs">tracked</p>
        </div>
      </div>
      <div className="grid gap-2">
        {entries.map((entry, index) => (
          <article key={entry.id} className={`grid border-4 border-black bg-white shadow-[6px_6px_0_#000] transition hover:-translate-x-1 hover:-translate-y-1 ${index % 2 ? "ml-7" : "mr-7"}`}>
            <div className="grid grid-cols-[86px_1fr]">
              <div className="border-r-4 border-black p-2 font-black">
                <p>{entry.start}</p>
                <p className="text-xs">{entry.end}</p>
              </div>
              <div className="p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold leading-none">{entry.action}</h3>
                  <span className="border-2 border-black px-2 py-0.5 text-xs font-black" style={{ backgroundColor: entry.color }}>{entry.duration}</span>
                </div>
                <p className="text-sm font-medium">{entry.title}</p>
                <div className="mt-3 flex justify-between border-t-2 border-black pt-2 text-xs font-black uppercase">
                  <span>{entry.active ? "Running now" : "Saved event"}</span>
                  <span>edit / delete</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
