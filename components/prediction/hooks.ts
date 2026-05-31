"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

import { STORAGE_KEYS } from "../../lib/prediction";
import { initialFormValues } from "./constants";
import { FORM_SCHEMA_VERSION, type FieldType, type PersistedForm } from "./types";

const emptySubscribe = () => () => {};

export function useThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const toggle = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  return { isDark: mounted && resolvedTheme === "dark", toggle };
}

export function useAnnouncer() {
  const liveRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      if (!liveRef.current) return;
      liveRef.current.setAttribute("aria-live", priority);
      liveRef.current.textContent = "";
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
    data: values,
  } satisfies PersistedForm);
}

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
  const latestFormRef = useRef(formValues);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onRestoreRef = useRef(onRestore);
  const onRestoreErrorRef = useRef(onRestoreError);

  useEffect(() => {
    latestFormRef.current = formValues;
  }, [formValues]);

  useEffect(() => {
    onRestoreRef.current = onRestore;
    onRestoreErrorRef.current = onRestoreError;
  });

  useEffect(() => {
    if (isRestoredAndSyncedRef.current) return;
    try {
      const savedForm = localStorage.getItem(STORAGE_KEYS.form);
      if (!savedForm) {
        isRestoredAndSyncedRef.current = true;
        return;
      }
      const parsed = JSON.parse(savedForm) as Partial<PersistedForm> & {
        data?: PersistedForm["data"] & { lease_commence_date?: string };
      };
      if (parsed.v !== FORM_SCHEMA_VERSION || !parsed.data) {
        try {
          localStorage.removeItem(STORAGE_KEYS.form);
        } catch {
          /* ignore */
        }
        isRestoredAndSyncedRef.current = true;
        return;
      }

      const restored: FieldType = {
        ...initialFormValues,
        ...parsed.data,
      };
      onRestoreRef.current(restored);
      isRestoredAndSyncedRef.current = true;
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
