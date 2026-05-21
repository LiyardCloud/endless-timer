import { ArrowLeft, ArrowRight } from "lucide-react";

import { Input } from "@/components/ui/input";

type TimelinePanelVariantProps = {
  selectedDate: string;
  heading: string;
  rangeLabel: string;
  onSelectedDateChange: (value: string) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
};

export function TimelinePanelVariant3({
  selectedDate,
  heading,
  rangeLabel,
  onSelectedDateChange,
  onPreviousDay,
  onNextDay
}: TimelinePanelVariantProps) {
  return (
    <div className="rounded-[22px] bg-[radial-gradient(circle_at_15%_10%,rgba(38,92,255,0.34),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(230,129,57,0.2),transparent_26%),linear-gradient(135deg,#121826,#070910)] p-px">
      <section className="rounded-[21px] border border-white/15 bg-white/[0.08] p-2 shadow-panel backdrop-blur-xl">
        <div className="grid gap-2 rounded-[17px] bg-black/18 p-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">Timeline</span>
          <div className="min-w-0 px-1">
            <h2 className="text-lg font-semibold leading-tight text-white">{heading}</h2>
            <p className="truncate text-xs text-white/55">{rangeLabel}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white transition hover:bg-white/[0.14]" onClick={onPreviousDay}>
              <ArrowLeft size={15} />
              <span className="sr-only">Previous day</span>
            </button>
            <Input type="date" value={selectedDate} onChange={(event) => onSelectedDateChange(event.target.value)} className="h-9 flex-1 rounded-full bg-black/20 py-0 sm:w-[148px]" />
            <button type="button" className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white transition hover:bg-white/[0.14]" onClick={onNextDay}>
              <ArrowRight size={15} />
              <span className="sr-only">Next day</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
