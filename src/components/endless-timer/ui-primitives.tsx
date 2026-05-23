import type { CSSProperties, ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">
      {children}
    </span>
  );
}

export function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export function Surface({
  className,
  style,
  children
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Card
      noShadow
      className={cn("overflow-hidden rounded-[22px] border-white/8 bg-white/[0.035]", className)}
      style={style}
    >
      {children}
    </Card>
  );
}
