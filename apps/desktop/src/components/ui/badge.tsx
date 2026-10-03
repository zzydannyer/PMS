import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "cyan" | "amber" | "rose" | "slate" | "green";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  amber: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  rose: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  slate: "border-slate-700 bg-slate-800 text-slate-300",
  green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
};

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "theme-badge inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
