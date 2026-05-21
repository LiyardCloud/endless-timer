import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";

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
    <div className="rounded-[22px] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.045)_0px,rgba(255,255,255,0.045)_1px,transparent_1px,transparent_9px),linear-gradient(135deg,rgba(38,92,255,0.26),rgba(7,9,16,0.9))] p-px">
      <section className="rounded-[21px] border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 shadow-panel backdrop-blur-xl">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/55">Timeline</span>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="text-lg font-semibold leading-tight text-white">{heading}</h2>
              <span className="truncate text-xs text-white/55">{rangeLabel}</span>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <label className="flex h-9 min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 text-sm text-white sm:w-[170px]">
              <Calendar size={15} />
              <input type="date" value={selectedDate} onChange={(event) => onSelectedDateChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]" />
            </label>
            <div className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-black/18 p-1">
              <Button variant="outline" size="icon" className="size-8 border-white/[0.055] bg-black/20 hover:border-white/[0.09] hover:bg-black/30" onClick={onPreviousDay}><ArrowLeft size={14} /><span className="sr-only">Previous day</span></Button>
              <Button variant="outline" size="icon" className="size-8 border-white/[0.055] bg-black/20 hover:border-white/[0.09] hover:bg-black/30" onClick={onNextDay}><ArrowRight size={14} /><span className="sr-only">Next day</span></Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
