import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";

type TimelinePanelVariantProps = {
  selectedDate: string;
  heading: string;
  onSelectedDateChange: (value: string) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
};

export function TimelinePanelVariant6({
  selectedDate,
  heading,
  onSelectedDateChange,
  onPreviousDay,
  onNextDay
}: TimelinePanelVariantProps) {
  return (
    <div className="rounded-[22px] bg-[radial-gradient(circle_at_15%_10%,rgba(38,92,255,0.34),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(230,129,57,0.2),transparent_26%),linear-gradient(135deg,#121826,#070910)] p-px">
      <section className="rounded-[21px] border border-white/15 bg-white/[0.08] px-3.5 py-3 shadow-panel backdrop-blur-xl">
        <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex items-center gap-1.5 rounded-full border border-white/12 bg-black/18 p-1">
            <Button variant="outline" size="icon" className="size-9 bg-white/[0.08]" onClick={onPreviousDay}><ArrowLeft size={15} /><span className="sr-only">Previous day</span></Button>
            <Button variant="outline" size="icon" className="size-9 bg-white/[0.08]" onClick={onNextDay}><ArrowRight size={15} /><span className="sr-only">Next day</span></Button>
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/55">Timeline</span>
              <h2 className="truncate text-lg font-semibold text-white">{heading}</h2>
            </div>
            <label className="flex h-9 min-w-0 items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 text-sm text-white sm:w-[170px]">
              <Calendar size={15} />
              <input type="date" value={selectedDate} onChange={(event) => onSelectedDateChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]" />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
