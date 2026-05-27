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
  "relative overflow-hidden border-border/60 shadow-sm ring-1 ring-foreground/5 transition-all duration-300 hover:shadow-md hover:shadow-primary/5";

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
  const requestControllerRef = useRef<AbortController | null>(null);
  const latestFormRef = useRef(formValues);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keep latestFormRef in sync without triggering re-renders
  useEffect(() => {
    latestFormRef.current = formValues;
  });

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
        lease_commence_date === prev.lease_commence_date
      ) {
        return prev;
      }
      return { ml_model, town, lease_commence_date };
    });
  }, []);

  // ⚡ Bolt Optimization: Debounce localStorage writes
  // Prevents main thread blocking during rapid keystrokes.
  // Uses latestFormRef + unmount flush to prevent data loss on navigation away.
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

  // Flush pending localStorage write on unmount to prevent data loss
  useEffect(() => {
    return () => {
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
      setOutput(0);
      setTrendData(defaultTrendData);
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
    [t],
  );

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
          <div className="grid grid-cols-2 gap-5 max-[860px]:grid-cols-1">
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
      <div className="mx-auto max-w-7xl">
        <header className="animate-fade-in-deep sticky top-0 z-20 -mx-6 mb-6 flex items-center justify-between gap-4 border-b border-border/50 bg-background/85 px-6 py-4 backdrop-blur-md max-sm:relative max-sm:mx-0 max-sm:flex-col max-sm:items-start max-sm:px-0">
          <div className="flex items-center gap-2.5">
            <span className="font-heading text-base font-bold tracking-tight">{t("brand")}</span>
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

        <div className="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-start gap-5 max-[860px]:grid-cols-1">
          <div className="flex flex-col gap-5">
            <Card
              size="sm"
              className={cn(panelCard, "animate-fade-in-deep border-l-4 border-l-primary/70 py-6")}
            >
              <div
                className="pointer-events-none absolute -right-20 -top-16 size-56 rounded-full bg-primary/15 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-20 -left-16 size-48 rounded-full bg-chart-2/15 blur-3xl"
                aria-hidden
              />
              <CardHeader className="relative px-6 pb-0">
                <CardTitle
                  asChild
                  className={cn(
                    "font-heading whitespace-pre-line text-[clamp(2rem,5vw,3rem)] font-bold normal-case tracking-tight",
                    isZh && "font-cjk font-extrabold",
                  )}
                >
                  <h1>{t("price_prediction")}</h1>
                </CardTitle>
                <CardDescription className="max-w-prose text-base leading-relaxed">
                  {t("intro_blurb")}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative px-6 pt-4">
                <div className="animate-stagger grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
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
              </CardContent>
            </Card>

            <Card size="sm" className={cn(panelCard, "animate-fade-in-deep border-l-4 border-l-primary/70 py-6")}>
              <CardHeader className="px-6 pb-2">
                <CardTitle asChild className="text-primary normal-case">
                  <h2>{t("prediction_form")}</h2>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                {loading && (
                  <div className="progress-track mb-4" role="progressbar" aria-label={t("predicting")}>
                    <div className="progress-bar" style={{ width: "60%" }} />
                  </div>
                )}
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
              </CardContent>
            </Card>
          </div>

          <div ref={resultsRef}>
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
