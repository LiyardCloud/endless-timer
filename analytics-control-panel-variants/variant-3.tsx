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

export function AnalyticsControlPanelVariant3(props: AnalyticsControlPanelProps) {
  return (
    <div className="rounded-[22px] bg-[radial-gradient(circle_at_0%_50%,rgba(38,92,255,0.38),transparent_34%),radial-gradient(circle_at_100%_40%,rgba(230,129,57,0.18),transparent_30%),linear-gradient(135deg,#121826,#070910)] p-px">
      <section className="rounded-[21px] border border-white/[0.08] bg-white/[0.055] p-2 shadow-panel backdrop-blur-xl">
        <div className="grid gap-2 rounded-[17px] bg-black/18 p-2 lg:grid-cols-[auto_1fr] lg:items-center">
          <span className="rounded-full border border-white/[0.07] bg-black/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">Analytics</span>
          <div className="grid gap-2 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-tight text-white">Activity breakdown</h2>
              <p className="truncate text-xs text-white/55">{props.rangeLabel}</p>
            </div>
            <PresetBar preset={props.preset} onPresetChange={props.onPresetChange} />
          </div>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_1.2fr]">
          <DateField label="From" value={props.from} onChange={props.onFromChange} />
          <DateField label="To" value={props.to} onChange={props.onToChange} />
          <ActivitySelect selectedActionId={props.selectedActionId} actions={props.actions} onActionChange={props.onActionChange} />
        </div>
      </section>
    </div>
  );
}

function PresetBar({ preset, onPresetChange }: Pick<AnalyticsControlPanelProps, "preset" | "onPresetChange">) {
  return (
    <div className="flex gap-1.5 overflow-x-auto rounded-full border border-white/[0.07] bg-black/18 p-1">
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
