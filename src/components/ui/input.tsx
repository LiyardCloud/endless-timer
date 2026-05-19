import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-12 w-full rounded-2xl border border-border bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-border-strong focus:bg-white/7 focus:ring-4 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export { Input };
