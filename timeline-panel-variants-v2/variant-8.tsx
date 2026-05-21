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

export function TimelinePanelVariant8({
  selectedDate,
  heading,
  rangeLabel,
  onSelectedDateChange,
  onPreviousDay,
  onNextDay
}: TimelinePanelVariantProps) {
  return (
    <div className="rounded-[22px] bg-[radial-gradient(circle_at_15%_10%,rgba(38,92,255,0.34),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(230,129,57,0.2),transparent_26%),linear-gradient(135deg,#121826,#070910)] p-px">
      <section className="rounded-[21px] border border-white/15 bg-white/[0.08] px-3 py-2.5 shadow-panel backdrop-blur-xl">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex items-center gap-2">
            <div className="h-7 w-1 rounded-full bg-accent" />
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">Timeline</span>
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="text-lg font-semibold text-white">{heading}</h2>
                <span className="truncate text-xs text-white/52">{rangeLabel}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] gap-2 sm:w-[260px]">
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
