"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Home, Layers, MapPin, Moon, Sparkles, Sun } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "../../lib/i18n";
import {
  MIN_FLOOR_AREA_SQM,
  clampFloorAreaSqm,
  type PredictionRequestBody,
} from "../../lib/prediction";
import PredictionForm from "./PredictionForm";
import PredictionResults from "./PredictionResults";
import { StatTile } from "./stat-tile";
import { defaultTrendData, initialFormValues } from "./constants";
import {
  useAnnouncer,
  useFormPersistence,
  useKeyboardShortcuts,
  useThemeToggle,
} from "./hooks";
import { FLAT_MODELS, ML_MODELS, TOWNS } from "../../lib/lists";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ApiResponse, FieldType, SummaryValues } from "./types";
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
import { cn } from "@/lib/utils";

const MAX_PREDICTION_CACHE_SIZE = 50;

function getPredictionCacheKey(body: PredictionRequestBody): string {
  return JSON.stringify(
    Object.keys(body)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = body[key as keyof PredictionRequestBody];
        return acc;
      }, {}),
  );
}

const panelCard =
  "relative overflow-hidden border-border/60 shadow-none transition-all duration-300";

export default function PredictionClient() {
  const { t, lang, changeLang } = useI18n();
  const { isDark, toggle: toggleTheme } = useThemeToggle();
  const { liveRef, announce } = useAnnouncer();
  const [output, setOutput] = useState(0);
  const [trendData, setTrendData] = useState(defaultTrendData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<FieldType>(initialFormValues);
  // Derived from the form rather than stored: the summary tiles mirror the
  // current selection. Memoized so PredictionResults (memo) only re-renders
  // when one of these three fields actually changes.
  const summaryValues = useMemo<SummaryValues>(
    () => ({
      ml_model: formValues.ml_model,
      town: formValues.town,
      lease_commence_date: formValues.lease_commence_date,
    }),
    [formValues.ml_model, formValues.town, formValues.lease_commence_date],
  );
  const resultsRef = useRef<HTMLDivElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const predictionCacheRef = useRef<Map<string, ApiResponse>>(new Map());

  // Enable theme color transitions only after the first paint, so the initial
  // (pre-painted) theme doesn't animate.
  useEffect(() => {
    document.documentElement.classList.add("theme-ready");
  }, []);

  useFormPersistence({
    formValues,
    onRestore: setFormValues,
    onRestoreError: () => toast.error(t("error_form_restore_failed")),
  });

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
    setFormValues((prev) => ({ ...prev, ...allValues }));
  }, []);

  const handleReset = useCallback(() => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setLoading(false);
    setError(null);
    setFormValues(initialFormValues);
    setOutput(0);
    setTrendData(defaultTrendData);
  }, []);

  const handleFinish = useCallback(
    async (values: FieldType) => {
      const floorArea =
        typeof values.floor_area_sqm === "number"
          ? clampFloorAreaSqm(values.floor_area_sqm)
          : MIN_FLOOR_AREA_SQM;
      const requestBody: PredictionRequestBody = {
        mlModel: values.ml_model,
        town: values.town,
        storeyRange: values.storey_range,
        flatModel: values.flat_model,
        floorAreaSqm: floorArea,
        leaseCommenceYear: values.lease_commence_date.year,
      };

      const applyServerData = (serverData: ApiResponse) => {
        const normalizedData = normalizeTrendData(serverData);
        if (!trendDataHasValidPrices(normalizedData)) {
          throw new Error(t("error_invalid_prediction"));
        }
        setTrendData(normalizedData);
        const predictedPrice = normalizePrice(normalizedData[normalizedData.length - 1]?.value ?? 0);
        setOutput(predictedPrice);
        toast.success(t("prediction_success"), { id: "prediction" });
        announce(
          lang === "zh"
            ? `预测完成。预估价格：$${Math.round(predictedPrice).toLocaleString()}`
            : `Prediction complete. Estimated price: $${Math.round(predictedPrice).toLocaleString()}`,
          "assertive",
        );
      };

      // ⚡ Bolt: Cache API responses to prevent redundant network requests
      // when users toggle inputs back and forth or submit identical queries.
      const cacheKey = getPredictionCacheKey(requestBody);
      const cached = predictionCacheRef.current.get(cacheKey);
      if (cached) {
        predictionCacheRef.current.delete(cacheKey);
        predictionCacheRef.current.set(cacheKey, cached);
        try {
          setError(null);
          applyServerData(cached);
        } catch (err: unknown) {
          setOutput(0);
          setTrendData(defaultTrendData);
          const msg = getErrorMessage(err, t("error_fetch"));
          setError(msg);
          toast.error(msg);
        }
        return;
      }

      requestControllerRef.current?.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;
      setLoading(true);
      setError(null);
      setOutput(0);
      setTrendData(defaultTrendData);

      try {
        const response = await fetch("/api/prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: cacheKey,
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(await getResponseErrorMessage(response, t("error_fetch")));
        }
        const serverData: ApiResponse = await response.json();

        if (predictionCacheRef.current.size >= MAX_PREDICTION_CACHE_SIZE) {
          const oldestKey = predictionCacheRef.current.keys().next().value;
          if (oldestKey !== undefined) {
            predictionCacheRef.current.delete(oldestKey);
          }
        }
        predictionCacheRef.current.set(cacheKey, serverData);
        applyServerData(serverData);
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
  useKeyboardShortcuts({
    onSubmit: () => {
      if (!loading) handleFinish(formValues);
    },
    onReset: () => {
      handleReset();
      announce(lang === "zh" ? "表单已重置" : "Form reset");
    },
  });

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
                  aria-label={isDark ? t("switch_to_light_mode") : t("switch_to_dark_mode")}
                  onClick={toggleTheme}
                >
                  {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                {isDark ? t("switch_to_light_mode") : t("switch_to_dark_mode")}
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
