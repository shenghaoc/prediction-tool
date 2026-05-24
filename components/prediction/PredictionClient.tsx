"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Home, Layers, MapPin, Moon, Sun } from "lucide-react";

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
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  const handleFormChange = useCallback((_: unknown, allValues: Partial<FieldType>) => {
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
    { label: t("stat_models"), value: ML_MODELS.length.toString().padStart(2, "0"), icon: Layers },
    { label: t("stat_towns"), value: TOWNS.length.toString().padStart(2, "0"), icon: MapPin },
    { label: t("stat_types"), value: FLAT_MODELS.length.toString().padStart(2, "0"), icon: Home },
  ];

  if (!mounted) return null;

  const isZh = lang === "zh";

  return (
    <main className="min-h-screen px-6 pb-12 pt-5 max-sm:px-3 max-sm:pb-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
          <div className="flex items-center gap-2.5">
            <span className="font-heading text-base font-bold tracking-tight">{t("brand")}</span>
            <Badge variant="secondary" className="rounded-full uppercase">
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
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setDarkMode((value) => !value)}
            >
              {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-start gap-5 max-[860px]:grid-cols-1">
          <div className="flex flex-col gap-5">
            <Card
              size="sm"
              className="border-l-4 border-l-primary/70 py-6 shadow-sm ring-1 ring-foreground/5"
            >
              <CardHeader className="px-6 pb-0">
                <CardTitle
                  className={cn(
                    "font-heading whitespace-pre-line text-[clamp(2rem,5vw,3rem)] font-bold normal-case tracking-tight",
                    isZh && "font-cjk font-extrabold",
                  )}
                >
                  {t("price_prediction")}
                </CardTitle>
                <CardDescription className="max-w-prose text-base">
                  {t("intro_blurb")}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pt-4">
                <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
                  {figures.map((figure) => {
                    const Icon = figure.icon;
                    return (
                      <div
                        key={figure.label}
                        className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/50 p-4"
                      >
                        <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {figure.label}
                          </span>
                          <strong className="font-heading text-xl font-extrabold tabular-nums text-primary">
                            {figure.value}
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card size="sm" className="border-l-4 border-l-primary/70 py-6 shadow-sm ring-1 ring-foreground/5">
              <CardHeader className="px-6 pb-2">
                <CardTitle className="text-primary normal-case">{t("prediction_form")}</CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
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
