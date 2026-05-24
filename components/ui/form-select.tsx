"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FormSelectOption<T extends string = string> = {
  value: T;
  label: string;
};

const triggerClassName =
  "h-10 w-full rounded-lg border border-border/60 bg-card px-3 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/15 data-[placeholder]:text-muted-foreground";

type FormSelectProps<T extends string = string> = {
  id?: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly FormSelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
};

export function FormSelect<T extends string>({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: FormSelectProps<T>) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as T)} disabled={disabled}>
      <SelectTrigger id={id} className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" sideOffset={6}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
