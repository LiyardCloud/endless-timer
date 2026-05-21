import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TimelinePanelVariantProps = {
  selectedDate: string;
  heading: string;
  rangeLabel: string;
  onSelectedDateChange: (value: string) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
};

export function TimelinePanelVariant2({
  selectedDate,
  heading,
  rangeLabel,
  onSelectedDateChange,
  onPreviousDay,
  onNextDay
}: TimelinePanelVariantProps) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-accent/35 bg-white/[0.025]">
      <div className="grid gap-0 sm:grid-cols-[1fr_auto]">
        <div className="flex min-w-0 items-center gap-3 px-4 py-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
            <Calendar size={17} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted">Timeline</span>
            <h2 className="truncate text-xl font-bold leading-tight text-white">{heading}</h2>
          </div>
          <div className="ml-auto hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-muted sm:block">
            {rangeLabel}
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-white/8 bg-white/[0.025] px-4 py-3 sm:border-l sm:border-t-0">
          <Button variant="default" size="icon" className="size-9" onClick={onPreviousDay}>
            <ArrowLeft size={15} />
            <span className="sr-only">Previous day</span>
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(event) => onSelectedDateChange(event.target.value)}
            className="h-9 w-full rounded-full px-3 py-0 sm:w-[150px]"
          />
          <Button variant="default" size="icon" className="size-9" onClick={onNextDay}>
            <ArrowRight size={15} />
            <span className="sr-only">Next day</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
