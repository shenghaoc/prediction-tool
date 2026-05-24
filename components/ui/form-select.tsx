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
  "h-10 w-full rounded-lg border border-border/60 bg-card px-3 shadow-none";

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
      {/* popper keeps the menu aligned to the trigger in scrollable layouts */}
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
