import { Calendar, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionItem } from "@/lib/types";

type AnalyticsPreset = "today" | "7d" | "30d" | "custom";

type AnalyticsControlPanelProps = {
  preset: AnalyticsPreset;
  from: string;
  to: string;
  selectedActionId: string;
  actions: ActionItem[];
  rangeLabel: string;
  onPresetChange: (preset: AnalyticsPreset) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onActionChange: (value: string) => void;
};

const presets: Array<{ id: AnalyticsPreset; label: string }> = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "custom", label: "Custom" }
];

export function AnalyticsControlPanelVariant1(props: AnalyticsControlPanelProps) {
  return (
    <div className="rounded-[22px] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.045)_0px,rgba(255,255,255,0.045)_1px,transparent_1px,transparent_9px),linear-gradient(135deg,rgba(38,92,255,0.26),rgba(7,9,16,0.9))] p-px">
      <section className="rounded-[21px] border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 shadow-panel backdrop-blur-xl">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <Header rangeLabel={props.rangeLabel} />
          <PresetBar preset={props.preset} onPresetChange={props.onPresetChange} compact />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1.2fr]">
          <DateField label="From" value={props.from} onChange={props.onFromChange} />
          <DateField label="To" value={props.to} onChange={props.onToChange} />
          <ActivitySelect {...props} />
        </div>
      </section>
    </div>
  );
}

function Header({ rangeLabel }: { rangeLabel: string }) {
  return (
    <div className="min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/55">Analytics</span>
      <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <h2 className="text-lg font-semibold leading-tight text-white">Activity breakdown</h2>
        <span className="truncate text-xs text-white/55">{rangeLabel}</span>
      </div>
    </div>
  );
}

function PresetBar({ preset, onPresetChange, compact = false }: Pick<AnalyticsControlPanelProps, "preset" | "onPresetChange"> & { compact?: boolean }) {
  return (
    <div className={cn("flex", compact ? "gap-1.5 overflow-x-auto rounded-full border border-white/[0.07] bg-black/18 p-1" : "flex-wrap gap-2")}>
      {presets.map((item) => (
        <Button key={item.id} variant="outline" size="sm" className={cn("h-8 px-3", preset === item.id && "border-white/[0.12] bg-black/30 text-white")} onClick={() => onPresetChange(item.id)}>
          {item.label}
        </Button>
      ))}
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="min-w-0">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">{label}</span>
      <span className="flex h-9 min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 text-sm text-white">
        <Calendar size={15} className="shrink-0 text-white/75" />
        <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]" />
      </span>
    </label>
  );
}

function ActivitySelect({ selectedActionId, actions, onActionChange }: Pick<AnalyticsControlPanelProps, "selectedActionId" | "actions" | "onActionChange">) {
  return (
    <label className="min-w-0">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Activity filter</span>
      <span className="flex h-9 min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 text-sm text-white">
        <Filter size={15} className="shrink-0 text-white/75" />
        <select value={selectedActionId} onChange={(event) => onActionChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none">
          <option value="all" className="bg-[#0b1020] text-white">All activities</option>
          {actions.map((action) => <option key={action.id} value={action.id} className="bg-[#0b1020] text-white">{action.name}</option>)}
        </select>
      </span>
    </label>
  );
}
