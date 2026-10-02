import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  className?: string;
  indicatorClassName?: string;
};

export function Progress({
  value,
  className,
  indicatorClassName,
}: ProgressProps) {
  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-slate-800", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className={cn(
          "h-full rounded-full bg-cyan-400 transition-[width]",
          indicatorClassName,
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
