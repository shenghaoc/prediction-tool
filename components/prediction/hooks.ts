"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import { Temporal } from "../../lib/temporal";
import { STORAGE_KEYS, serializeLeaseCommenceDate } from "../../lib/prediction";
import { initialFormValues } from "./constants";
import { FORM_SCHEMA_VERSION, type FieldType, type PersistedForm } from "./types";

// Theme toggle backed by next-themes. `isDark` is only meaningful after mount
// (the server can't know the persisted theme), so it stays false until then to
// keep the toggle button's icon hydration-safe.
export function useThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  return { isDark: mounted && resolvedTheme === "dark", toggle };
}

// Imperative screen-reader announcer backed by an aria-live region.
export function useAnnouncer() {
  const liveRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      if (!liveRef.current) return;
      liveRef.current.setAttribute("aria-live", priority);
      liveRef.current.textContent = "";
      // Use setTimeout instead of rAF so the announcement fires even in background tabs.
      // The small delay (50ms) ensures screen readers detect the text change.
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (liveRef.current) liveRef.current.textContent = message;
      }, 50);
    },
    [],
  );

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return { liveRef, announce };
}

// Document-level keyboard shortcuts. The handlers are kept in refs so the
// listener is attached once yet always invokes the latest closures.
export function useKeyboardShortcuts({
  onSubmit,
  onReset,
}: {
  onSubmit: () => void;
  onReset: () => void;
}) {
  const onSubmitRef = useRef(onSubmit);
  const onResetRef = useRef(onReset);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
    onResetRef.current = onReset;
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onSubmitRef.current();
      }
      if (
        e.key === "Escape" &&
        !document.querySelector('[role="listbox"]') &&
        document.activeElement?.closest("form")
      ) {
        onResetRef.current();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
}

function serializeForm(values: FieldType): string {
  return JSON.stringify({
    v: FORM_SCHEMA_VERSION,
    data: {
      ...values,
      lease_commence_date: serializeLeaseCommenceDate(values.lease_commence_date),
    },
  } satisfies PersistedForm);
}

// Persists form values to localStorage: restores once on mount, debounces
// writes to avoid blocking the main thread during rapid input, and flushes any
// pending write on unmount so the latest value is never dropped.
export function useFormPersistence({
  formValues,
  onRestore,
  onRestoreError,
}: {
  formValues: FieldType;
  onRestore: (restored: FieldType) => void;
  onRestoreError: () => void;
}) {
  const isRestoredAndSyncedRef = useRef(false);
  const restoredValuesRef = useRef<FieldType | null>(null);
  const latestFormRef = useRef(formValues);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onRestoreRef = useRef(onRestore);
  const onRestoreErrorRef = useRef(onRestoreError);

  useEffect(() => {
    latestFormRef.current = formValues;
    if (restoredValuesRef.current && formValues === restoredValuesRef.current) {
      isRestoredAndSyncedRef.current = true;
    }
  }, [formValues]);

  useEffect(() => {
    onRestoreRef.current = onRestore;
    onRestoreErrorRef.current = onRestoreError;
  });

  // Restore once on mount.
  useEffect(() => {
    if (isRestoredAndSyncedRef.current) return;
    try {
      const savedForm = localStorage.getItem(STORAGE_KEYS.form);
      if (!savedForm) {
        isRestoredAndSyncedRef.current = true;
        return;
      }
      const parsed = JSON.parse(savedForm) as Partial<PersistedForm>;
      // Discard payloads from an older/unknown schema silently — not an error.
      if (parsed.v !== FORM_SCHEMA_VERSION || !parsed.data) {
        try {
          localStorage.removeItem(STORAGE_KEYS.form);
        } catch {
          /* ignore */
        }
        isRestoredAndSyncedRef.current = true;
        return;
      }
      const { lease_commence_date: savedDate, ...rest } = parsed.data;
      const leaseDate = savedDate ? Temporal.PlainDate.from(savedDate) : undefined;
      const restored: FieldType = {
        ...initialFormValues,
        ...rest,
        ...(leaseDate ? { lease_commence_date: leaseDate } : {}),
      };
      restoredValuesRef.current = restored;
      onRestoreRef.current(restored);
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEYS.form);
      } catch {
        /* ignore */
      }
      onRestoreErrorRef.current();
      isRestoredAndSyncedRef.current = true;
    }
  }, []);

  // Debounce writes to prevent main thread blocking during rapid keystrokes.
  useEffect(() => {
    if (!isRestoredAndSyncedRef.current) return;

    const writeForm = () => {
      saveTimeoutRef.current = undefined;
      try {
        localStorage.setItem(STORAGE_KEYS.form, serializeForm(latestFormRef.current));
      } catch {
        /* storage full or disabled */
      }
    };

    saveTimeoutRef.current = setTimeout(writeForm, 500);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [formValues]);

  // Flush a pending write on unmount to prevent data loss.
  useEffect(() => {
    return () => {
      if (!isRestoredAndSyncedRef.current) return;
      if (saveTimeoutRef.current !== undefined) {
        clearTimeout(saveTimeoutRef.current);
        try {
          localStorage.setItem(STORAGE_KEYS.form, serializeForm(latestFormRef.current));
        } catch {
          /* storage full or disabled */
        }
      }
    };
  }, []);
}
