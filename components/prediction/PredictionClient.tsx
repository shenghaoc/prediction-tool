"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Home, Layers, MapPin, Moon, Sparkles, Sun } from "lucide-react";
import { toast } from "sonner";

import { I18nProvider, useI18n } from "../../lib/i18n";
import { Temporal } from "../../lib/temporal";
import {
  MAX_FLOOR_AREA_SQM,
  MIN_FLOOR_AREA_SQM,
  STORAGE_KEYS,
  type PredictionRequestBody,
  serializeLeaseCommenceDate,
} from "../../lib/prediction";
import PredictionForm from "./PredictionForm";
import PredictionResults from "./PredictionResults";
import { StatTile } from "./stat-tile";
import { defaultTrendData, initialFormValues } from "./constants";
import { FLAT_MODELS, ML_MODELS, TOWNS } from "../../lib/lists";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  trendDataHasValidPrices,
} from "./utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const panelCard =
  "relative overflow-hidden border-border/60 shadow-none transition-all duration-300";

export default function PredictionClient() {
  return (
    <I18nProvider>
      <TooltipProvider delayDuration={300}>
        <PredictionClientInner />
      </TooltipProvider>
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
  const resultsRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);
  const latestFormRef = useRef(formValues);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const predictionCacheRef = useRef<Record<string, ApiResponse>>({});

  // Keep latestFormRef in sync without triggering re-renders
  useEffect(() => {
    latestFormRef.current = formValues;
  }, [formValues]);

  // Keep loadingRef in sync to prevent stale closure in keyboard shortcut
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    if (!liveRef.current) return;
    liveRef.current.setAttribute("aria-live", priority);
    liveRef.current.textContent = "";
    // Use setTimeout instead of rAF so the announcement fires even in background tabs.
    // The small delay (50ms) ensures screen readers detect the text change.
    setTimeout(() => {
      if (liveRef.current) liveRef.current.textContent = message;
    }, 50);
  }, []);

  useEffect(() => {
    const isDark = localStorage.getItem(STORAGE_KEYS.theme) === "dark";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", darkMode);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, darkMode ? "dark" : "light");
    } catch {
      /* storage full or disabled */
    }
  }, [darkMode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.add("theme-ready");
  }, [mounted]);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    const savedForm = localStorage.getItem(STORAGE_KEYS.form);
    if (!savedForm) return;
    try {
      const parsed = JSON.parse(savedForm) as PersistedFieldValues;
      const { lease_commence_date: savedDate, ...rest } = parsed;
      const leaseDate = savedDate ? Temporal.PlainDate.from(savedDate) : undefined;
      const restored: FieldType = {
        ...initialFormValues,
        ...rest,
        ...(leaseDate ? { lease_commence_date: leaseDate } : {}),
      };
      setFormValues(restored);
      setSummaryValues({
        ml_model: restored.ml_model,
        town: restored.town,
        lease_commence_date: restored.lease_commence_date,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEYS.form);
      toast.error(t("error_form_restore_failed"));
    }
  }, [t]);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (output > 0) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      // Focus management: move focus to results area after prediction
      setTimeout(() => {
        resultsRef.current?.focus({ preventScroll: false });
      }, 100);
    }
  }, [output]);

  const handleFormChange = useCallback((allValues: Partial<FieldType>) => {
    setError(null);
    setFormValues((prev) => {
      const next = { ...prev, ...allValues };
      return next;
    });
    setSummaryValues((prev) => {
      const ml_model = allValues.ml_model ?? prev.ml_model;
      const town = allValues.town ?? prev.town;
      const lease_commence_date = allValues.lease_commence_date ?? prev.lease_commence_date;
      if (
        ml_model === prev.ml_model &&
        town === prev.town &&
        lease_commence_date.year === prev.lease_commence_date.year
      ) {
        return prev;
      }
      return { ml_model, town, lease_commence_date };
    });
  }, []);

  // Debounce localStorage writes to prevent main thread blocking during rapid keystrokes.
  // Uses a ref so the timeout callback always reads the latest values without re-closing.
  useEffect(() => {
    if (!mounted) return;

    const writeForm = () => {
      saveTimeoutRef.current = undefined;
      try {
        localStorage.setItem(
          STORAGE_KEYS.form,
          JSON.stringify({
            ...latestFormRef.current,
            lease_commence_date: serializeLeaseCommenceDate(
              latestFormRef.current.lease_commence_date,
            ),
          } satisfies PersistedFieldValues),
        );
      } catch {
        /* storage full or disabled */
      }
    };

    saveTimeoutRef.current = setTimeout(writeForm, 500);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [formValues, mounted]);

  // Flush pending localStorage write on unmount to prevent data loss.
  // Skip if the restore effect hasn't run yet — writing initialFormValues
  // would overwrite the user's previously saved form state.
  useEffect(() => {
    return () => {
      if (!hasRestoredRef.current) return;
      if (saveTimeoutRef.current !== undefined) {
        clearTimeout(saveTimeoutRef.current);
      }
      try {
        localStorage.setItem(
          STORAGE_KEYS.form,
          JSON.stringify({
            ...latestFormRef.current,
            lease_commence_date: serializeLeaseCommenceDate(
              latestFormRef.current.lease_commence_date,
            ),
          } satisfies PersistedFieldValues),
        );
      } catch {
        /* storage full or disabled */
      }
    };
  }, []);

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
  }, []);

  const handleFinish = useCallback(
    async (values: FieldType) => {
      requestControllerRef.current?.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;
      setLoading(true);
      setError(null);
      const floorArea =
        typeof values.floor_area_sqm === "number"
          ? Math.max(MIN_FLOOR_AREA_SQM, Math.min(MAX_FLOOR_AREA_SQM, values.floor_area_sqm))
          : MIN_FLOOR_AREA_SQM;
      const requestBody: PredictionRequestBody = {
        mlModel: values.ml_model,
        town: values.town,
        storeyRange: values.storey_range,
        flatModel: values.flat_model,
        floorAreaSqm: floorArea,
        leaseCommenceYear: values.lease_commence_date.year,
      };

      // ⚡ Bolt: Cache API responses to prevent redundant network requests
      // when users toggle inputs back and forth or submit identical queries.
      const cacheKey = JSON.stringify(requestBody);
      let serverData: ApiResponse;

      try {
        if (predictionCacheRef.current[cacheKey]) {
          serverData = predictionCacheRef.current[cacheKey];
        } else {
          setOutput(0);
          setTrendData(defaultTrendData);
          const response = await fetch("/api/prices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: cacheKey,
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error(await getResponseErrorMessage(response, t("error_fetch")));
          }
          serverData = await response.json();
          predictionCacheRef.current[cacheKey] = serverData;
        }

        const normalizedData = normalizeTrendData(serverData);
        if (!trendDataHasValidPrices(normalizedData)) {
          throw new Error(t("error_invalid_prediction"));
        }
        setTrendData(normalizedData);
        const predictedPrice = normalizePrice(normalizedData[normalizedData.length - 1]?.value ?? 0);
        setOutput(predictedPrice);
        setSummaryValues({
          ml_model: values.ml_model,
          town: values.town,
          lease_commence_date: values.lease_commence_date,
        });
        toast.success(t("prediction_success"), { id: "prediction" });
        announce(
          lang === "zh"
            ? `预测完成。预估价格：$${Math.round(predictedPrice).toLocaleString()}`
            : `Prediction complete. Estimated price: $${Math.round(predictedPrice).toLocaleString()}`,
          "assertive",
        );
      } catch (err: unknown) {
        if (isAbortError(err)) return;
        setOutput(0);
        setTrendData(defaultTrendData);
        const msg = getErrorMessage(err, t("error_fetch"));
        setError(msg);
        toast.error(msg);
      } finally {
        if (requestControllerRef.current === controller) {
          requestControllerRef.current = null;
          setLoading(false);
        }
      }
    },
    [t, lang, announce],
  );

  // Keyboard shortcuts: Ctrl/Cmd+Enter to submit, Escape to reset
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!loadingRef.current) handleFinish(latestFormRef.current);
      }
      if (
        e.key === "Escape" &&
        !document.querySelector('[role="listbox"]') &&
        document.activeElement?.closest("form")
      ) {
        handleReset();
        announce(lang === "zh" ? "表单已重置" : "Form reset");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lang, handleFinish, handleReset, announce]);

  const figures = [
    {
      label: t("stat_models"),
      value: ML_MODELS.length.toString().padStart(2, "0"),
      icon: Layers,
      hint: t("stat_models_hint"),
    },
    {
      label: t("stat_towns"),
      value: TOWNS.length.toString().padStart(2, "0"),
      icon: MapPin,
      hint: t("stat_towns_hint"),
    },
    {
      label: t("stat_types"),
      value: FLAT_MODELS.length.toString().padStart(2, "0"),
      icon: Home,
      hint: t("stat_types_hint"),
    },
  ];

  if (!mounted) {
    return (
      <main className="min-h-screen px-6 pb-12 pt-5" aria-busy="true">
        <div className="mx-auto max-w-7xl space-y-5">
          <Skeleton className="animate-shimmer h-10 w-full max-w-md rounded-xl" />
          <div className="grid grid-cols-2 gap-5 max-[960px]:grid-cols-1">
            <Skeleton className="animate-shimmer h-64 rounded-xl" />
            <Skeleton className="animate-shimmer h-96 rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  const isZh = lang === "zh";

  return (
    <main className="min-h-screen px-6 pb-12 pt-5 max-sm:px-3 max-sm:pb-8">
      {/* Skip navigation — visible on focus for keyboard users */}
      <a
        href="#input-ml_model"
        className="fixed -left-[9999px] top-auto z-[100] h-px w-px overflow-hidden focus:fixed focus:left-4 focus:top-4 focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-lg focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-primary-foreground focus:no-underline focus:shadow-lg"
      >
        Skip to form
      </a>

      {/* Live region for screen reader announcements */}
      <div
        ref={liveRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="absolute size-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]"
      />

      <div className="mx-auto max-w-7xl">
        <header className="sticky top-0 z-20 -mx-6 mb-6 flex items-center justify-between gap-4 border-b border-border/50 bg-background/85 px-6 py-4 backdrop-blur-md max-sm:relative max-sm:mx-0 max-sm:flex-col max-sm:items-start max-sm:px-0">
          <div className="flex items-center gap-2.5">
            <span className="font-sans text-xs font-bold tracking-tight">{t("brand")}</span>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3" aria-hidden />
              {t("badge")}
            </Badge>
          </div>

          <div className="flex items-center gap-2 max-sm:w-full max-sm:[&>*]:flex-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="normal-case tracking-normal max-sm:flex-1"
              onClick={() => {
                startTransition(() => {
                  changeLang(lang === "en" ? "zh" : "en");
                });
              }}
            >
              {t("switch_language")}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={darkMode ? t("switch_to_light_mode") : t("switch_to_dark_mode")}
                  onClick={() => setDarkMode((value) => !value)}
                >
                  {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                {darkMode ? t("switch_to_light_mode") : t("switch_to_dark_mode")}
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-start gap-5 max-[960px]:grid-cols-1">
          <div className="flex flex-col gap-5">
            <Card
              size="sm"
              className={cn(panelCard, "py-6")}
            >
              <CardHeader className="px-6 pb-0">
                <CardTitle
                  asChild
                  className={cn(
                    "whitespace-pre-line text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold normal-case tracking-tight",
                    isZh && "font-cjk font-extrabold",
                  )}
                >
                  <h1>{t("price_prediction")}</h1>
                </CardTitle>
                <CardDescription className="max-w-prose text-sm leading-relaxed">
                  {t("intro_blurb")}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative px-6 pt-4">
                <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
                  {figures.map((figure) => (
                    <StatTile
                      key={figure.label}
                      icon={figure.icon}
                      label={figure.label}
                      value={figure.value}
                      hint={figure.hint}
                    />
                  ))}
                </div>
                <p className="mt-3.5 text-[0.82rem] leading-relaxed text-muted-foreground">
                  {t("intro_caption")}
                </p>
              </CardContent>
            </Card>

            <Card size="sm" className={cn(panelCard, "py-6")}>
              <CardHeader className="px-6 pb-2">
                <CardTitle asChild className="text-primary normal-case">
                  <h2>{t("prediction_form")}</h2>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                {error && !loading && (
                  <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
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
                {loading && (
                  <div className="progress-track mt-4" role="progressbar" aria-label={t("predicting")} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress-bar" style={{ width: "60%" }} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div ref={resultsRef} tabIndex={-1} className="outline-none" aria-label={t("predicted_price")}>
            <PredictionResults
              output={output}
              summaryValues={summaryValues}
              t={t}
              trendData={trendData}
              locale={lang}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
