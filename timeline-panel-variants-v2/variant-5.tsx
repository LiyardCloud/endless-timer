import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";

type TimelinePanelVariantProps = {
  selectedDate: string;
  heading: string;
  rangeLabel: string;
  onSelectedDateChange: (value: string) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
};

export function TimelinePanelVariant5({
  selectedDate,
  heading,
  rangeLabel,
  onSelectedDateChange,
  onPreviousDay,
  onNextDay
}: TimelinePanelVariantProps) {
  return (
    <div className="rounded-[22px] bg-[radial-gradient(circle_at_15%_10%,rgba(38,92,255,0.34),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(230,129,57,0.2),transparent_26%),linear-gradient(135deg,#121826,#070910)] p-px">
      <section className="rounded-[21px] border border-white/15 bg-white/[0.08] px-3.5 py-3 shadow-panel backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white/70"><Calendar size={15} /></div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/55">Timeline</span>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-white">{heading}</h2>
                <span className="text-xs text-white/55">{rangeLabel}</span>
              </div>
            </div>
          </div>
          <div className="flex rounded-full border border-white/12 bg-black/18 p-1">
            <button type="button" className="inline-flex size-8 items-center justify-center rounded-full text-white/80 hover:bg-white/10" onClick={onPreviousDay}><ArrowLeft size={15} /><span className="sr-only">Previous day</span></button>
            <input type="date" value={selectedDate} onChange={(event) => onSelectedDateChange(event.target.value)} className="h-8 w-full min-w-0 bg-transparent px-2 text-center text-xs text-white outline-none [color-scheme:dark] sm:w-[134px]" />
            <button type="button" className="inline-flex size-8 items-center justify-center rounded-full text-white/80 hover:bg-white/10" onClick={onNextDay}><ArrowRight size={15} /><span className="sr-only">Next day</span></button>
          </div>
        </div>
      </section>
    </div>
  );
}
