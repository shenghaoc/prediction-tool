"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type NumberFieldProps = {
  id: string;
  value: number | "";
  onChange: (value: number | "") => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  unit?: string;
  ariaLabel: string;
  className?: string;
};

export function NumberField({
  id,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  placeholder,
  unit,
  ariaLabel,
  className,
}: NumberFieldProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const numValue = typeof value === "number" ? value : NaN;
  const clamp = useCallback(
    (v: number) => Math.max(min, Math.min(max, Math.round(v))),
    [min, max],
  );
  const atMin = !isNaN(numValue) && numValue <= min;
  const atMax = !isNaN(numValue) && numValue >= max;

  const increment = useCallback(() => {
    const current = isNaN(numValue) ? min : numValue;
    onChange(clamp(current + step));
  }, [numValue, min, step, clamp, onChange]);

  const decrement = useCallback(() => {
    const current = isNaN(numValue) ? min : numValue;
    onChange(clamp(current - step));
  }, [numValue, min, step, clamp, onChange]);

  // Long-press to repeat with recursive setTimeout for dynamic acceleration
  const startHold = useCallback((fn: () => void) => {
    fn();
    let count = 0;
    const execute = () => {
      holdRef.current = setTimeout(() => {
        count++;
        fn();
        execute();
      }, count < 5 ? 200 : 80);
    };
    execute();
  }, []);

  const stopHold = useCallback(() => {
    if (holdRef.current) {
      clearTimeout(holdRef.current);
      holdRef.current = null;
    }
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      increment();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      decrement();
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(min);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(max);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange("");
      return;
    }
    const n = parseInt(raw, 10);
    if (!isNaN(n)) onChange(n);
  };

  const handleBlur = () => {
    setFocused(false);
    if (typeof value === "number") {
      onChange(clamp(value));
    }
  };

  const stepperBtn =
    "flex items-center justify-center border-none bg-secondary/60 text-secondary-foreground transition-all duration-150 p-0 cursor-pointer font-[inherit] hover:bg-primary/10 hover:text-primary";

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "grid overflow-hidden rounded-[var(--radius-xl,0.875rem)] border transition-all duration-200",
        focused
          ? "border-primary/50 shadow-[var(--shadow-focus,0_0_0_3px_color-mix(in_oklab,var(--ring,var(--primary))_25%,transparent)),0_4px_12px_color-mix(in_oklab,var(--primary)_5%,transparent)]"
          : "border-border/60",
        unit ? "grid-cols-[40px_1fr_auto_40px]" : "grid-cols-[40px_1fr_40px]",
        className,
      )}
    >
      {/* Decrement */}
      <button
        type="button"
        tabIndex={-1}
        disabled={atMin}
        aria-label="Decrease value"
        onPointerDown={(e) => {
          if (!atMin) {
            e.preventDefault();
            startHold(decrement);
          }
        }}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        className={cn(stepperBtn, atMin && "cursor-not-allowed opacity-35")}
      >
        <Minus className="size-3.5" aria-hidden />
      </button>

      {/* Input */}
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        role="spinbutton"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={isNaN(numValue) ? undefined : numValue}
        aria-label={ariaLabel}
        value={value === "" || value === undefined ? "" : value}
        placeholder={placeholder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        autoComplete="off"
        className={cn(
          "h-[var(--height-field,42px)] w-full border-x border-border/40 bg-card px-3 text-center text-[0.95rem] font-semibold tabular-nums text-foreground outline-none",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        )}
      />

      {/* Unit label */}
      {unit && (
        <span
          className="flex items-center border-r border-border/40 bg-secondary/60 px-3.5 text-xs font-bold whitespace-nowrap text-muted-foreground"
          aria-hidden="true"
        >
          {unit}
        </span>
      )}

      {/* Increment */}
      <button
        type="button"
        tabIndex={-1}
        disabled={atMax}
        aria-label="Increase value"
        onPointerDown={(e) => {
          if (!atMax) {
            e.preventDefault();
            startHold(increment);
          }
        }}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        className={cn(stepperBtn, atMax && "cursor-not-allowed opacity-35")}
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
