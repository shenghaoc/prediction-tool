"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Home, Layers, MapPin } from "lucide-react";
import type { TFunction } from "../../lib/i18n";
import type { SummaryValues, TrendPoint } from "./types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const PriceTrendChart = dynamic(() => import("./PriceTrendChart"), {
  ssr: false,
  loading: () => <div className="min-h-[260px]" />,
});

type PredictionResultsProps = {
  output: number;
  summaryValues: SummaryValues;
  t: TFunction;
  trendData: TrendPoint[];
  locale: string;
};

export default function PredictionResults({
  output,
  summaryValues,
  t,
  trendData,
  locale,
}: PredictionResultsProps) {
  const hasOutput = output > 0;

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
    { label: t("ml_model"), value: summaryValues.ml_model, icon: Layers },
    { label: t("town"), value: summaryValues.town, icon: MapPin },
    {
      label: t("lease_commence_date"),
      value: String(summaryValues.lease_commence_date.year),
      icon: Home,
    },
  ];

  return (
    <Card
      size="sm"
      className="border-l-4 border-l-primary/70 py-6 shadow-sm ring-1 ring-foreground/5"
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 px-6 pb-2 max-sm:flex-col">
        <div>
          <Badge variant="secondary" className="mb-2">
            {t("predicted_trends")}
          </Badge>
          <CardTitle className="font-heading text-2xl normal-case tracking-tight">
            {t("predicted_price")}
          </CardTitle>
        </div>
        <div className="min-w-[180px] rounded-lg border border-primary/20 bg-accent/80 px-4 py-3 max-sm:w-full">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("prediction")}
          </p>
          <p
            key={output}
            className={cn(
              "mt-1 font-heading text-2xl font-extrabold tabular-nums tracking-tight text-primary",
              !hasOutput && "text-base font-semibold text-muted-foreground",
              hasOutput && "animate-settle",
            )}
          >
            {hasOutput ? fmt(output) : t("awaiting")}
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 px-6">
        <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
          {summaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/50 p-3"
              >
                <Icon className="size-4 shrink-0 text-primary" aria-hidden />
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
                  value={`${chartStats.deltaValue >= 0 ? "+" : "-"}${fmt(Math.abs(chartStats.deltaValue))}`}
                  hint={t("vs_12m_ago")}
                />
              </div>
              <div className="relative min-h-[260px]">
                <PriceTrendChart data={trendData} locale={locale} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 px-4 py-10 text-center">
            <svg className="opacity-40" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
              <rect x="8" y="28" width="10" height="28" rx="3" fill="var(--primary)" opacity="0.3" />
              <rect x="22" y="18" width="10" height="38" rx="3" fill="var(--primary)" opacity="0.5" />
              <rect x="36" y="10" width="10" height="46" rx="3" fill="var(--primary)" opacity="0.7" />
              <rect x="50" y="20" width="10" height="36" rx="3" fill="var(--primary)" opacity="0.4" />
              <line x1="4" y1="58" x2="62" y2="58" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h3 className="font-heading text-base font-semibold text-foreground">{t("placeholder_title")}</h3>
            <p className="mx-auto max-w-[30ch] text-sm leading-relaxed text-muted-foreground">
              {t("placeholder_body")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatChip({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/50 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{value}</p>
      {hint && (
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
