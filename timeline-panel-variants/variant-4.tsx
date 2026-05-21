import { ArrowLeft, ArrowRight } from "lucide-react";

type TimelinePanelVariantProps = {
  selectedDate: string;
  heading: string;
  rangeLabel: string;
  onSelectedDateChange: (value: string) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
};

export function TimelinePanelVariant4({
  selectedDate,
  heading,
  rangeLabel,
  onSelectedDateChange,
  onPreviousDay,
  onNextDay
}: TimelinePanelVariantProps) {
  return (
    <section className="border-2 border-white bg-background text-white shadow-[8px_8px_0_#265cff]">
      <div className="grid grid-cols-1 md:grid-cols-[150px_1fr_auto]">
        <div className="border-b-2 border-white px-3 py-2 md:border-b-0 md:border-r-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted">Timeline</span>
          <h2 className="mt-0.5 text-2xl font-black uppercase leading-none">{heading}</h2>
        </div>
        <div className="flex min-w-0 items-center border-b-2 border-white px-3 py-2 md:border-b-0 md:border-r-2">
          <p className="truncate font-mono text-sm uppercase tracking-[0.08em] text-foreground">Showing: {rangeLabel}</p>
        </div>
        <div className="flex items-center gap-0">
          <button
            type="button"
            className="inline-flex h-11 w-12 items-center justify-center border-r-2 border-white bg-primary text-primary-foreground transition hover:bg-white"
            onClick={onPreviousDay}
          >
            <ArrowLeft size={16} />
            <span className="sr-only">Previous day</span>
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => onSelectedDateChange(event.target.value)}
            className="h-11 w-[150px] border-0 bg-background px-2 font-mono text-xs uppercase text-white outline-none [color-scheme:dark]"
          />
          <button
            type="button"
            className="inline-flex h-11 w-12 items-center justify-center border-l-2 border-white bg-primary text-primary-foreground transition hover:bg-white"
            onClick={onNextDay}
          >
            <ArrowRight size={16} />
            <span className="sr-only">Next day</span>
          </button>
        </div>
      </div>
    </section>
  );
}
