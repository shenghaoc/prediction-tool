"use client";

import type { LucideIcon } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type StatTileProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  className?: string;
};

export function StatTile({ icon: Icon, label, value, hint, className }: StatTileProps) {
  const tile = (
    <div
      tabIndex={hint ? 0 : undefined}
      className={cn(
        "group/tile flex items-center gap-3 rounded-[var(--radius-xl,8px)] border border-border bg-card p-3 transition-all duration-200",
        "hover:border-primary/25",
        hint && "cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md,6px)] bg-primary/10 transition-all duration-200 group-hover/tile:bg-primary/15"
        aria-hidden
      >
        <Icon className="size-4 text-primary" />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <strong className="font-sans text-lg font-extrabold tabular-nums tracking-tight text-primary">
          {value}
        </strong>
      </div>
    </div>
  );

  if (!hint) return tile;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{tile}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-center leading-relaxed">
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}
