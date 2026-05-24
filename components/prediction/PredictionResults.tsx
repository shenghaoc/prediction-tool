"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Home, Layers, MapPin, TrendingDown, TrendingUp } from "lucide-react";
import type { TFunction } from "../../lib/i18n";
import type { SummaryValues, TrendPoint } from "./types";
import { ResultsSkeleton } from "./results-skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function ChartAreaSkeleton() {
  return <Skeleton className="min-h-[260px] w-full rounded-xl" />;
}

const PriceTrendChart = dynamic(() => import("./PriceTrendChart"), {
  ssr: false,
  loading: () => <ChartAreaSkeleton />,
});

const panelCard =
  "relative overflow-hidden border-border/60 shadow-sm ring-1 ring-foreground/5 transition-shadow duration-300 hover:shadow-md hover:shadow-primary/5";

type PredictionResultsProps = {
  output: number;
  summaryValues: SummaryValues;
  t: TFunction;
  trendData: TrendPoint[];
  locale: string;
  loading?: boolean;
};

export default function PredictionResults({
  output,
  summaryValues,
  t,
  trendData,
  locale,
  loading = false,
}: PredictionResultsProps) {
  const hasOutput = output > 0;
  const showSkeleton = loading && !hasOutput;

  const chartStats = useMemo(() => {
    const latestValue = trendData[trendData.length - 1]?.value ?? 0;
    const firstValue = trendData[0]?.value ?? 0;
    const peakValue = Math.max(...trendData.map((point) => point.value), 0);
    const lowValue = trendData.reduce(
      (currentLowest, point) =>
        point.value > 0 ? Math.min(currentLowest, point.value) : currentLowest,
      Number.POSITIVE_INFINITY,
    );
    const deltaValue = latestValue - firstValue;
    return {
      latestValue,
      peakValue,
      lowValue: Number.isFinite(lowValue) ? lowValue : 0,
      deltaValue,
    };
  }, [trendData]);

  const formatter = new Intl.NumberFormat(locale === "zh" ? "zh-SG" : "en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  });
  const fmt = (v: number) => formatter.format(Math.round(v));

  const summaryItems = [
    {
      label: t("ml_model"),
      value: t(`ml_models.${summaryValues.ml_model}`, summaryValues.ml_model),
      icon: Layers,
    },
    {
      label: t("town"),
      value: t(`towns.${summaryValues.town}`, summaryValues.town),
      icon: MapPin,
    },
    {
      label: t("lease_commence_date"),
      value: String(summaryValues.lease_commence_date.year),
      icon: Home,
    },
  ];

  const deltaPositive = chartStats.deltaValue >= 0;

  return (
    <section aria-labelledby="prediction-results-heading" aria-busy={loading}>
      <Card size="sm" className={cn(panelCard, "border-l-4 border-l-primary/70 py-6")}>
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <CardHeader className="relative flex flex-row items-start justify-between gap-4 px-6 pb-2 max-sm:flex-col">
          <div>
            <Badge variant="secondary" className="mb-2">
              {t("predicted_trends")}
            </Badge>
            <CardTitle
              asChild
              className="font-heading text-2xl normal-case tracking-tight"
            >
              <h2 id="prediction-results-heading">{t("predicted_price")}</h2>
            </CardTitle>
          </div>
          <div
            className={cn(
              "relative min-w-[200px] overflow-hidden rounded-xl border px-5 py-4 max-sm:w-full",
              "border-primary/25 bg-gradient-to-br from-primary/12 via-accent/60 to-card",
              "shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--primary-foreground)_12%,transparent)]",
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_55%)]"
              aria-hidden
            />
            <p className="relative text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("prediction")}
            </p>
            {showSkeleton ? (
              <Skeleton className="relative mt-2 h-9 w-36" />
            ) : (
              <p
                key={output}
                className={cn(
                  "relative mt-1 font-heading text-3xl font-extrabold tabular-nums tracking-tight",
                  !hasOutput && "text-base font-semibold text-muted-foreground",
                  hasOutput && "text-primary animate-settle",
                )}
              >
                {hasOutput ? fmt(output) : t("awaiting")}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative flex flex-col gap-5 px-6">
          {showSkeleton ? (
            <ResultsSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
                {summaryItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/40 p-3 backdrop-blur-sm"
                    >
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15"
                        aria-hidden
                      >
                        <Icon className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="truncate text-sm font-semibold text-foreground">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasOutput ? (
                <>
                  <Separator />
                  <div>
                    <CardDescription className="mb-1 uppercase tracking-wider">
                      {t("predicted_trends")}
                    </CardDescription>
                    <h3 className="mb-3 font-heading text-sm font-semibold normal-case">
                      {t("chart_story_title")}
                    </h3>
                    <div className="mb-4 grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
                      <StatChip label={t("chart_latest")} value={fmt(chartStats.latestValue)} />
                      <StatChip
                        label={t("chart_range")}
                        value={`${fmt(chartStats.lowValue)} – ${fmt(chartStats.peakValue)}`}
                      />
                      <StatChip
                        label={t("chart_delta")}
                        value={`${deltaPositive ? "+" : "-"}${fmt(Math.abs(chartStats.deltaValue))}`}
                        hint={t("vs_12m_ago")}
                        trend={deltaPositive ? "up" : "down"}
                      />
                    </div>
                    <div className="relative min-h-[260px] rounded-xl border border-border/40 bg-secondary/20 p-2">
                      {loading ? (
                        <ChartAreaSkeleton />
                      ) : (
                        <PriceTrendChart data={trendData} locale={locale} />
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-12 text-center">
                  <div className="flex items-end gap-1.5 opacity-50" aria-hidden>
                    {[0.35, 0.55, 0.85, 0.45].map((h, i) => (
                      <div
                        key={i}
                        className="w-2.5 rounded-sm bg-primary"
                        style={{ height: `${h * 48}px` }}
                      />
                    ))}
                  </div>
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    {t("placeholder_title")}
                  </h3>
                  <p className="mx-auto max-w-[32ch] text-sm leading-relaxed text-muted-foreground">
                    {t("placeholder_body")}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function StatChip({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: "up" | "down";
}) {
  const TrendIcon = trend === "down" ? TrendingDown : trend === "up" ? TrendingUp : null;

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 flex items-center gap-1 text-sm font-semibold tabular-nums",
          trend === "up" && "text-emerald-600 dark:text-emerald-400",
          trend === "down" && "text-amber-700 dark:text-amber-400",
          !trend && "text-foreground",
        )}
      >
        {TrendIcon && <TrendIcon className="size-3.5 shrink-0" aria-hidden />}
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
