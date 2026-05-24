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
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/60 bg-card/90 p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-200",
        "hover:border-primary/25 hover:shadow-md hover:shadow-primary/5",
        hint && "cursor-help",
        className,
      )}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15"
        aria-hidden
      >
        <Icon className="size-5 text-primary" />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <strong className="font-heading text-xl font-extrabold tabular-nums tracking-tight text-primary">
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
