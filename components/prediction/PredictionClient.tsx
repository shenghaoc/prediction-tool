"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { I18nProvider, useI18n } from "../../lib/i18n";
import { Temporal } from "../../lib/temporal";
import {
  STORAGE_KEYS,
  type PredictionRequestBody,
  serializeLeaseCommenceDate,
} from "../../lib/prediction";
import PredictionForm from "./PredictionForm";
import PredictionResults from "./PredictionResults";
import { defaultTrendData, initialFormValues } from "./constants";
import { FLAT_MODELS, ML_MODELS, TOWNS } from "../../lib/lists";
import type {
  ApiResponse,
  FieldType,
  PersistedFieldValues,
  SummaryValues,
} from "./types";
import {
  getErrorMessage,
  getResponseErrorMessage,
  isAbortError,
  normalizePrice,
  normalizeTrendData,
} from "./utils";

export default function PredictionClient() {
  return (
    <I18nProvider>
      <PredictionClientInner />
    </I18nProvider>
  );
}

function PredictionClientInner() {
  const { t, lang, changeLang } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [output, setOutput] = useState(0);
  const [trendData, setTrendData] = useState(defaultTrendData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<FieldType>(initialFormValues);
  const [summaryValues, setSummaryValues] = useState<SummaryValues>({
    ml_model: initialFormValues.ml_model,
    town: initialFormValues.town,
    lease_commence_date: initialFormValues.lease_commence_date,
  });
  const hasRestoredRef = useRef(false);
  const requestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem(STORAGE_KEYS.theme) === "dark") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem(STORAGE_KEYS.theme, darkMode ? "dark" : "light");
  }, [darkMode, mounted]);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    const savedForm = localStorage.getItem(STORAGE_KEYS.form);
    if (!savedForm) return;
    try {
      const parsed = JSON.parse(savedForm) as PersistedFieldValues;
      const { lease_commence_date: savedDate, ...rest } = parsed;
      const leaseDate = savedDate ? Temporal.PlainDate.from(savedDate) : undefined;
      setFormValues((prev) => ({
        ...prev,
        ...rest,
        ...(leaseDate ? { lease_commence_date: leaseDate } : {}),
      }));
      setSummaryValues({
        ml_model: rest.ml_model ?? initialFormValues.ml_model,
        town: rest.town ?? initialFormValues.town,
        lease_commence_date: leaseDate ?? initialFormValues.lease_commence_date,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEYS.form);
    }
  }, []);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
    };
  }, []);

  const handleFormChange = useCallback(
    (_: unknown, allValues: Partial<FieldType>) => {
      setError(null);
      setFormValues((prev) => ({ ...prev, ...allValues }));
      const persist: PersistedFieldValues = {
        ...allValues,
        lease_commence_date: allValues.lease_commence_date
          ? serializeLeaseCommenceDate(allValues.lease_commence_date)
          : undefined,
      };
      localStorage.setItem(STORAGE_KEYS.form, JSON.stringify(persist));
      setSummaryValues({
        ml_model: allValues.ml_model ?? initialFormValues.ml_model,
        town: allValues.town ?? initialFormValues.town,
        lease_commence_date:
          allValues.lease_commence_date ?? initialFormValues.lease_commence_date,
      });
    },
    [],
  );

  const handleReset = useCallback(() => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setLoading(false);
    setError(null);
    setFormValues(initialFormValues);
    setOutput(0);
    setTrendData(defaultTrendData);
    setSummaryValues({
      ml_model: initialFormValues.ml_model,
      town: initialFormValues.town,
      lease_commence_date: initialFormValues.lease_commence_date,
    });
    localStorage.removeItem(STORAGE_KEYS.form);
  }, []);

  const handleFinish = useCallback(
    async (values: FieldType) => {
      requestControllerRef.current?.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;
      setLoading(true);
      setError(null);
      const requestBody: PredictionRequestBody = {
        mlModel: values.ml_model,
        town: values.town,
        storeyRange: values.storey_range,
        flatModel: values.flat_model,
        floorAreaSqm: values.floor_area_sqm,
        leaseCommenceYear: values.lease_commence_date.year,
      };
      try {
        const response = await fetch("/api/prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(await getResponseErrorMessage(response, t("error_fetch")));
        }
        const serverData: ApiResponse = await response.json();
        const normalizedData = normalizeTrendData(serverData);
        setTrendData(normalizedData);
        setOutput(normalizePrice(normalizedData[normalizedData.length - 1]?.value ?? 0));
      } catch (err: unknown) {
        if (isAbortError(err)) return;
        setError(getErrorMessage(err, t("error_fetch")));
      } finally {
        if (requestControllerRef.current === controller) {
          requestControllerRef.current = null;
          setLoading(false);
        }
      }
    },
    [t],
  );

  const figures = [
    {
      label: t("stat_models"),
      value: ML_MODELS.length.toString().padStart(2, "0"),
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <rect x="2" y="2.5" width="18" height="5" rx="1.5" fill="currentColor" opacity="0.25" />
          <rect x="2" y="8.5" width="18" height="5" rx="1.5" fill="currentColor" opacity="0.55" />
          <rect x="2" y="14.5" width="18" height="5" rx="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: t("stat_towns"),
      value: TOWNS.length.toString().padStart(2, "0"),
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path d="M11 2C7.13 2 4 5.13 4 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" />
          <circle cx="11" cy="9" r="2.75" fill="var(--color-surface)" />
        </svg>
      ),
    },
    {
      label: t("stat_types"),
      value: FLAT_MODELS.length.toString().padStart(2, "0"),
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path d="M2.5 19.5V8l8.5-6.5L19.5 8v11.5h-5.5v-6.5H8v6.5H2.5z" fill="currentColor" />
        </svg>
      ),
    },
  ];

  if (!mounted) return null;

  const isZh = lang === "zh";

  return (
    <main className="min-h-screen bg-page px-6 pb-16 pt-8 text-text transition-[background,color] duration-300 max-sm:px-3 max-sm:pb-10">
      <div className="mx-auto max-w-7xl">
        {/* ── Topbar ── */}
        <header className="mb-6 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-base font-bold tracking-[-0.02em] text-text">
              {t("brand")}
            </span>
            <span className="inline-flex items-center rounded-btn bg-primary-subtle px-2.5 py-[5px] text-[10px] font-bold uppercase tracking-[0.6px] text-primary">
              {t("badge")}
            </span>
          </div>

          <div className="flex gap-2 items-center max-sm:w-full max-sm:[&>*]:flex-1">
            <button
              className="rounded-btn flex min-h-[34px] cursor-pointer items-center border border-border bg-input-bg px-3.5 py-1.5 text-[13px] font-semibold text-text-secondary transition hover:-translate-y-px active:translate-y-0"
              onClick={() => {
                startTransition(() => {
                  changeLang(lang === "en" ? "zh" : "en");
                });
              }}
            >
              {t("switch_language")}
            </button>
            <button
              className="rounded-btn flex min-h-[34px] w-[34px] cursor-pointer items-center justify-center border border-border bg-input-bg p-0 text-text-secondary transition hover:-translate-y-px active:translate-y-0"
              onClick={() => setDarkMode((value) => !value)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M13.5 10.2a5.5 5.5 0 0 1-7.7-7.7 6 6 0 1 0 7.7 7.7Z" fill="currentColor" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* ── Layout grid ── */}
        <div className="grid grid-cols-1 gap-5 items-start lg:grid-cols-2">
          {/* ── Left column ── */}
          <div className="flex flex-col gap-5">
            {/* Intro card */}
            <div className="rounded-card border border-border bg-surface shadow-card transition-[background,border-color,box-shadow] duration-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/60 via-primary to-primary/30" />
              <div className="flex flex-col gap-4 p-6 max-sm:p-4">
                <h1
                  className={`font-display text-[clamp(2.4rem,5vw,3.6rem)] font-bold leading-[0.92] tracking-[-0.04em] whitespace-pre-line text-text${
                    isZh
                      ? " font-cjk font-extrabold tracking-[-0.02em] leading-[1.02]"
                      : ""
                  }`}
                >
                  {t("price_prediction")}
                </h1>
                <p className="max-w-[34ch] text-sm leading-[1.7] text-text-secondary">
                  {t("intro_blurb")}
                </p>
                <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
                  {figures.map((f) => (
                    <div
                      key={f.label}
                      className="flex flex-col gap-1.5 rounded-input border border-border bg-input-bg p-5 transition hover:-translate-y-0.5 hover:border-border-strong relative overflow-hidden"
                    >
                      <span className="absolute right-3 top-3 text-primary/10">{f.icon}</span>
                      <strong className="font-display text-2xl font-extrabold tracking-[-0.03em] tabular-nums text-primary">
                        {f.value}
                      </strong>
                      <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-text-muted">
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form card */}
            <div className="rounded-card border border-border bg-surface p-6 shadow-card transition-[background,border-color,box-shadow] duration-200 max-sm:p-4">
              {error && (
                <div className="mb-4 rounded-input border border-primary-muted bg-primary-bg px-3.5 py-3 text-sm leading-[1.5] text-text">
                  {error}
                </div>
              )}
              <PredictionForm
                formValues={formValues}
                loading={loading}
                onFinish={handleFinish}
                onReset={handleReset}
                onValuesChange={handleFormChange}
                t={t}
              />
            </div>
          </div>

          {/* ── Results ── */}
          <section>
            <PredictionResults
              output={output}
              summaryValues={summaryValues}
              t={t}
              trendData={trendData}
              locale={lang}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
