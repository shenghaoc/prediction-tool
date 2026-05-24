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
      const restoredValues: Partial<FieldType> = {
        ...parsed,
        lease_commence_date: parsed.lease_commence_date
          ? Temporal.PlainDate.from(parsed.lease_commence_date)
          : undefined,
      };
      setFormValues((prev) => ({ ...prev, ...restoredValues }));
      setSummaryValues({
        ml_model: restoredValues.ml_model ?? initialFormValues.ml_model,
        town: restoredValues.town ?? initialFormValues.town,
        lease_commence_date:
          restoredValues.lease_commence_date ?? initialFormValues.lease_commence_date,
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
    { label: t("stat_models"), value: ML_MODELS.length.toString().padStart(2, "0") },
    { label: t("stat_towns"), value: TOWNS.length.toString().padStart(2, "0") },
    { label: t("stat_types"), value: FLAT_MODELS.length.toString().padStart(2, "0") },
  ];

  if (!mounted) return null;

  const isZh = lang === "zh";

  return (
    <main className="min-h-screen bg-page px-6 pb-12 pt-5 text-text transition-[background,color] duration-300 max-sm:px-3 max-sm:pb-8">
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
              className="rounded-btn flex min-h-[34px] w-[34px] cursor-pointer items-center justify-center border border-border bg-input-bg p-0 text-[15px] font-semibold text-text-secondary transition hover:-translate-y-px active:translate-y-0"
              onClick={() => setDarkMode((value) => !value)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? "☀" : "◑"}
            </button>
          </div>
        </header>

        {/* ── Layout grid ── */}
        <div className="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-5 items-start max-[860px]:grid-cols-1">
          {/* ── Left column ── */}
          <div className="flex flex-col gap-5">
            {/* Intro card */}
            <div className="rounded-card border border-border bg-surface p-6 shadow-card transition-[background,border-color,box-shadow] duration-200 max-sm:p-4">
              <div className="flex flex-col gap-4">
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
                      className="flex flex-col gap-1 rounded-input border border-border bg-input-bg p-6"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-text-muted">
                        {f.label}
                      </span>
                      <strong className="font-display text-xl font-extrabold tracking-[-0.03em] tabular-nums text-primary">
                        {f.value}
                      </strong>
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
