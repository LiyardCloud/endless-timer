import { ArrowLeft, ArrowRight } from "lucide-react";

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

export function TimelinePanelVariant1({
  selectedDate,
  heading,
  rangeLabel,
  onSelectedDateChange,
  onPreviousDay,
  onNextDay
}: TimelinePanelVariantProps) {
  return (
    <section className="rounded-[18px] border border-white/10 bg-white/[0.035] px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">Timeline</span>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-lg font-semibold text-white">{heading}</h2>
            <p className="text-sm text-muted">Entries for {rangeLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(event) => onSelectedDateChange(event.target.value)}
            className="h-9 w-[152px] rounded-full px-3 py-0"
          />
          <Button variant="outline" size="icon" className="size-9" onClick={onPreviousDay}>
            <ArrowLeft size={15} />
            <span className="sr-only">Previous day</span>
          </Button>
          <Button variant="outline" size="icon" className="size-9" onClick={onNextDay}>
            <ArrowRight size={15} />
            <span className="sr-only">Next day</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
