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

export function TimelinePanelVariant4({
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
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/55">Timeline</span>
              <h2 className="mt-0.5 text-lg font-semibold leading-tight text-white">{heading}</h2>
            </div>
            <span className="rounded-full border border-[#e68139]/25 bg-[#e68139]/10 px-3 py-1 text-xs text-[#ffd8bd]">{rangeLabel}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <Button variant="outline" size="icon" className="size-9 bg-white/[0.08]" onClick={onPreviousDay}><ArrowLeft size={15} /><span className="sr-only">Previous day</span></Button>
            <label className="flex h-9 min-w-0 items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 text-sm text-white">
              <Calendar size={15} />
              <input type="date" value={selectedDate} onChange={(event) => onSelectedDateChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]" />
            </label>
            <Button variant="outline" size="icon" className="size-9 bg-white/[0.08]" onClick={onNextDay}><ArrowRight size={15} /><span className="sr-only">Next day</span></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
