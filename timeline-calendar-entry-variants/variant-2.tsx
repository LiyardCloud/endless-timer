const entries = [
  { id: 1, action: "Deep Work", color: "#6ee7b7", start: "08:10", end: "10:45", duration: "2h 35m", title: "Proposal outline and architecture cleanup" },
  { id: 2, action: "Break", color: "#fbbf24", start: "10:45", end: "11:05", duration: "20m", title: "Coffee and short walk" },
  { id: 3, action: "Planning", color: "#93c5fd", start: "11:05", end: "12:20", duration: "1h 15m", title: "Timeline calendar redesign notes" },
  { id: 4, action: "Admin", color: "#fda4af", start: "13:10", end: "14:00", duration: "50m", title: "Invoices and messages" },
  { id: 5, action: "Deep Work", color: "#6ee7b7", start: "14:00", end: "Now", duration: "1h 42m", title: "Implementation pass" }
];

const hours = ["08", "09", "10", "11", "12", "13", "14", "15"];
const positions = [0, 2.2, 3.15, 5.1, 6];
const spans = [2.6, 0.6, 1.25, 0.8, 1.7];

export function TimelineCalendarVariant2() {
  return (
    <section className="rounded-lg bg-[#101014] p-5 text-white shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold leading-none">23</h2>
          <p className="mt-1 text-sm font-semibold uppercase text-lime-300">May / Saturday</p>
        </div>
        <div className="rounded-full bg-lime-300 px-4 py-2 text-sm font-extrabold text-black">5 entries</div>
      </div>
      <div className="grid grid-cols-[44px_1fr] gap-3">
        <div className="space-y-[34px] pt-1">
          {hours.map((hour) => <div key={hour} className="text-xs font-bold text-white/35">{hour}:00</div>)}
        </div>
        <div className="relative min-h-[360px] border-l border-white/15 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:100%_45px]">
          {entries.map((entry, index) => (
            <article
              key={entry.id}
              className="absolute left-3 right-0 rounded-md border-2 border-black bg-white p-3 text-black shadow-[5px_5px_0_#bef264] transition hover:-translate-y-1"
              style={{ top: `${positions[index] * 45}px`, minHeight: `${Math.max(spans[index] * 45, 54)}px` }}
            >
              <p className="text-[11px] font-extrabold uppercase">{entry.start} - {entry.end}</p>
              <h3 className="text-sm font-extrabold">{entry.action}</h3>
              <p className="mt-1 line-clamp-2 text-xs font-medium text-black/65">{entry.title}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
