"use client";

import { useRef, useCallback, useEffect, type KeyboardEvent } from "react";
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
  unitLabel?: string;
  ariaLabel: string;
  required?: boolean;
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
  unitLabel,
  ariaLabel,
  required = false,
  className,
}: NumberFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  // Cleanup hold timer on unmount
  useEffect(() => {
    return () => {
      if (holdRef.current) {
        clearTimeout(holdRef.current);
        holdRef.current = null;
      }
    };
  }, []);

  const numValue = typeof value === "number" ? value : NaN;
  const clamp = useCallback(
    (v: number) => Math.max(min, Math.min(max, Math.round(v))),
    [min, max],
  );
  const atMin = !isNaN(numValue) && numValue <= min;
  const atMax = !isNaN(numValue) && numValue >= max;

  const increment = useCallback(() => {
    const current = typeof valueRef.current === "number" ? valueRef.current : min;
    onChange(clamp(current + step));
  }, [min, step, clamp, onChange]);

  const decrement = useCallback(() => {
    const current = typeof valueRef.current === "number" ? valueRef.current : min;
    onChange(clamp(current - step));
  }, [min, step, clamp, onChange]);

  // Long-press to repeat with recursive setTimeout for dynamic acceleration
  const startHold = useCallback((fn: () => void) => {
    if (holdRef.current) {
      clearTimeout(holdRef.current);
      holdRef.current = null;
    }
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
    const sanitized = raw.replace(/[^0-9]/g, "");
    if (sanitized === "") {
      onChange("");
      return;
    }
    const n = Number(sanitized);
    if (!isNaN(n)) onChange(n);
  };

  const handleBlur = () => {
    // Read the latest value from the ref to avoid the falsy-zero pitfall
    // where the prop value is "" but the ref still holds the last number.
    const latest = valueRef.current;
    if (typeof latest === "number") {
      onChange(clamp(latest));
    }
  };

  const stepperBtn =
    "flex items-center justify-center border-none bg-secondary/60 text-secondary-foreground transition-all duration-150 p-0 cursor-pointer font-[inherit] hover:bg-primary/10 hover:text-primary";

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "grid overflow-hidden rounded-[var(--radius-sm,3px)] border border-border transition-all duration-200 hover:border-primary/30 focus-within:border-primary/50 focus-within:shadow-[var(--shadow-focus)]",
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
        required={required}
        aria-required={required}
        aria-label={ariaLabel}
        aria-describedby={unit ? `${id}-unit` : undefined}
        value={value === "" || value === undefined ? "" : value}
        placeholder={placeholder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoComplete="off"
        className={cn(
          "h-[var(--height-field,32px)] w-full border-x border-border/40 bg-card px-3 text-center text-[0.875rem] font-medium tabular-nums text-foreground outline-none",
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
      {/* Accessible unit label for screen readers */}
      {unit && (
        <span id={`${id}-unit`} className="sr-only">{unitLabel ?? unit}</span>
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
