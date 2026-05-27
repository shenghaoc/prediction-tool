"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
};

type ComboboxProps = {
  id: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  className?: string;
};

export function Combobox({
  id,
  options,
  value,
  onChange,
  placeholder = "Search…",
  ariaLabel,
  className,
}: ComboboxProps) {
  const listboxId = `${id}-listbox`;
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => {
    const opt = options.find((o) => o.value === value);
    return opt ? opt.label : "";
  }, [options, value]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Click outside → close
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);

  // Scroll active into view
  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[role="option"]');
    items[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  const handleSelect = useCallback(
    (optValue: string) => {
      onChange(optValue);
      setQuery("");
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    },
    [onChange],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(0);
        } else {
          setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (isOpen) {
          e.preventDefault();
          if (activeIndex >= 0 && filtered[activeIndex]) {
            handleSelect(filtered[activeIndex].value);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setQuery("");
        break;
      case "Home":
        if (isOpen) {
          e.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (isOpen) {
          e.preventDefault();
          setActiveIndex(filtered.length - 1);
        }
        break;
    }
  };

  const activeOptionId =
    activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative flex">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          value={isOpen ? query : selectedLabel}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setFocused(true);
            setIsOpen(true);
            setQuery("");
          }}
          onBlur={(e) => {
            setFocused(false);
            if (!containerRef.current?.contains(e.relatedTarget as Node)) {
              setIsOpen(false);
              setQuery("");
            }
          }}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            "h-[var(--height-field,42px)] w-full rounded-[var(--radius-xl,0.875rem)] border bg-card pl-3.5 pr-9 text-[0.95rem] font-semibold text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground",
            focused
              ? "border-primary/50 shadow-[var(--shadow-focus,0_0_0_3px_color-mix(in_oklab,var(--ring,var(--primary))_25%,transparent)),0_4px_12px_color-mix(in_oklab,var(--primary)_5%,transparent)]"
              : "border-border/60",
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle options"
          onClick={() => {
            setIsOpen((o) => !o);
            if (!isOpen) inputRef.current?.focus();
          }}
          className="absolute right-0 top-0 bottom-0 flex w-9 items-center justify-center border-none bg-transparent text-muted-foreground transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
        >
          <ChevronDown className="size-3" aria-hidden />
        </button>
      </div>

      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-50 left-0 right-0 top-[calc(100%+6px)] max-h-60 overflow-y-auto rounded-[var(--radius-xl,0.875rem)] border border-border/60 bg-card p-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3.5 py-3 text-center text-[0.85rem] italic text-muted-foreground">
              No matches
            </li>
          ) : (
            filtered.map((opt, i) => {
              const isActive = i === activeIndex;
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-[calc(var(--radius-xl,0.875rem)-4px)] px-3 py-2.5 text-[0.9rem] transition-colors duration-100",
                    isActive && "bg-primary/10",
                    isSelected && "font-bold text-primary",
                    !isActive && !isSelected && "font-semibold text-foreground",
                  )}
                >
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
                  )}
                </li>
              );
            })
          )}
          {query && filtered.length > 0 && (
            <li className="mx-1 mt-0.5 border-t border-border/40 px-3.5 pt-2 text-center text-[0.72rem] opacity-70">
              {filtered.length} of {options.length} options
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
