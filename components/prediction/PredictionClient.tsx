"use client";

import { startTransition, useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { Home, Layers, MapPin, Moon, Sparkles, Sun } from "lucide-react";
import { toast } from "sonner";

import { predictAction, type PredictActionState } from "../../app/actions/predict";
import { useI18n } from "../../lib/i18n";
import {
  predictionFormSchema,
  predictionFormValuesToFormData,
} from "../../lib/prediction-schema";
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
import type { FieldType, SummaryValues, TrendPoint } from "./types";
import {
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

const panelCard =
  "relative overflow-hidden border-border/60 shadow-none transition-all duration-300";

const emptyViewState = {
  output: 0,
  trendData: defaultTrendData,
  formError: null as string | null,
};

function resolvePredictionView(
  actionState: PredictActionState,
  showResults: boolean,
  isPending: boolean,
  t: (key: string) => string,
): { output: number; trendData: TrendPoint[]; formError: string | null } {
  if (!showResults || isPending || !actionState) {
    return emptyViewState;
  }

  if (actionState.ok) {
    const normalizedData = normalizeTrendData({ predictions: actionState.predictions });
    if (!trendDataHasValidPrices(normalizedData)) {
      return { ...emptyViewState, formError: t("error_invalid_prediction") };
    }

    return {
      output: normalizePrice(normalizedData[normalizedData.length - 1]?.value ?? 0),
      trendData: normalizedData,
      formError: null,
    };
  }

  const formError = actionState.formError
    ? actionState.formError === "Prediction service unavailable."
      ? t("error_fetch")
      : actionState.formError
    : null;

  return { ...emptyViewState, formError };
}

export default function PredictionClient() {
  const { t, lang, changeLang } = useI18n();
  const { isDark, toggle: toggleTheme } = useThemeToggle();
  const { liveRef, announce } = useAnnouncer();
  const [actionState, dispatchAction, isPending] = useActionState(
    predictAction,
    null as PredictActionState,
  );
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const lastNotifiedActionRef = useRef<PredictActionState>(null);

  const form = useForm<FieldType>({
    resolver: zodResolver(predictionFormSchema) as Resolver<FieldType>,
    defaultValues: initialFormValues,
    mode: "onSubmit",
  });

  const watchedValues = useWatch({ control: form.control });
  const formValues = useMemo(
    () => ({ ...initialFormValues, ...watchedValues }) as FieldType,
    [watchedValues],
  );

  const summaryValues = useMemo<SummaryValues>(
    () => ({
      ml_model: formValues.ml_model,
      town: formValues.town,
      lease_commence_year: formValues.lease_commence_year,
    }),
    [formValues.ml_model, formValues.town, formValues.lease_commence_year],
  );

  const { output, trendData, formError } = useMemo(
    () => resolvePredictionView(actionState, showResults, isPending, t),
    [actionState, showResults, isPending, t],
  );

  useEffect(() => {
    document.documentElement.classList.add("theme-ready");
  }, []);

  useFormPersistence({
    formValues,
    onRestore: (restored) => form.reset(restored),
    onRestoreError: () => toast.error(t("error_form_restore_failed")),
  });

  useEffect(() => {
    if (output > 0) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const id = setTimeout(() => {
        resultsRef.current?.focus({ preventScroll: false });
      }, 100);
      return () => clearTimeout(id);
    }
  }, [output]);

  useEffect(() => {
    if (!actionState || isPending || actionState === lastNotifiedActionRef.current) {
      return;
    }

    lastNotifiedActionRef.current = actionState;

    if (actionState.ok) {
      const normalizedData = normalizeTrendData({ predictions: actionState.predictions });
      if (!trendDataHasValidPrices(normalizedData)) {
        toast.error(t("error_invalid_prediction"));
        return;
      }

      const predictedPrice = normalizePrice(
        normalizedData[normalizedData.length - 1]?.value ?? 0,
      );
      toast.success(t("prediction_success"), { id: "prediction" });
      announce(
        t("sr_prediction_complete").replace(
          "{price}",
          `$${Math.round(predictedPrice).toLocaleString()}`,
        ),
        "assertive",
      );
      return;
    }

    if (actionState.fieldErrors) {
      for (const [field, messages] of Object.entries(actionState.fieldErrors)) {
        const message = messages[0];
        if (!message) continue;
        form.setError(field as keyof FieldType, { message });
      }
    }

    if (actionState.formError) {
      const message =
        actionState.formError === "Prediction service unavailable."
          ? t("error_fetch")
          : actionState.formError;
      toast.error(message);
    }
  }, [actionState, announce, form, isPending, t]);

  const handleSubmit = useCallback(
    (values: FieldType) => {
      setShowResults(true);
      startTransition(() => {
        dispatchAction(predictionFormValuesToFormData(values));
      });
    },
    [dispatchAction],
  );

  const handleReset = useCallback(() => {
    setShowResults(false);
    lastNotifiedActionRef.current = null;
    form.reset(initialFormValues);
  }, [form]);

  useKeyboardShortcuts({
    onSubmit: () => {
      if (!isPending) void form.handleSubmit(handleSubmit)();
    },
    onReset: () => {
      handleReset();
      announce(t("sr_form_reset"));
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
      <a
        href="#input-ml_model"
        className="fixed -left-[9999px] top-auto z-[100] h-px w-px overflow-hidden focus:fixed focus:left-4 focus:top-4 focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-lg focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-primary-foreground focus:no-underline focus:shadow-lg"
      >
        Skip to form
      </a>

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
            <Card size="sm" className={cn(panelCard, "py-6")}>
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
                {formError && !isPending && (
                  <div
                    role="alert"
                    className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    {formError}
                  </div>
                )}
                <PredictionForm
                  form={form}
                  onSubmit={handleSubmit}
                  onReset={handleReset}
                  isPending={isPending}
                  t={t}
                />
                {isPending && (
                  <div
                    className="progress-track mt-4"
                    role="progressbar"
                    aria-label={t("predicting")}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
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
              loading={isPending}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
