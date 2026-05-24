"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { TFunction } from "../../lib/i18n";

import LayersIcon from "../icons/LayersIcon";
import MapPinIcon from "../icons/MapPinIcon";
import HomeIcon from "../icons/HomeIcon";
import type { SummaryValues, TrendPoint } from "./types";

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

  /* ── Shared label/chip classes ── */
  const labelClass =
    "block text-[10px] font-bold uppercase tracking-[1px] text-text-muted";
  const chipClass =
    "rounded-input border px-3.5 py-3 bg-input-bg border-border flex items-center gap-2.5";

  return (
    <div className="flex flex-col gap-5 rounded-card border border-border bg-surface p-6 shadow-card transition-[background,border-color,box-shadow] duration-200 max-sm:p-4 relative overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-gradient-to-b before:from-primary/70 before:to-primary/30">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap max-sm:flex-col">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-[1.2px] text-text-muted">
            {t("predicted_trends")}
          </span>
          <h2 className="mt-1 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-bold leading-none tracking-[-0.03em] text-text">
            {t("predicted_price")}
          </h2>
        </div>
        <div className="min-w-[180px] rounded-input border border-primary-muted bg-primary-subtle px-5 py-3.5 max-sm:w-full">
          <span className="block text-[10px] font-bold uppercase tracking-[1.2px] text-text-muted">
            {t("prediction")}
          </span>
          <strong
            key={output}
            className={`mt-1.5 block font-display text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold leading-[1.1] tracking-[-0.03em] tabular-nums text-primary${
              hasOutput
                ? " animate-settle"
                : " text-[0.95rem] tracking-[-0.02em] text-text-muted"
            }`}
          >
            {hasOutput ? fmt(output) : t("awaiting")}
          </strong>
        </div>
      </div>

      {/* ── Metric pills ── */}
      <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
        <div className={chipClass}>
          <LayersIcon className="w-5 h-5 text-primary/80 shrink-0" />
          <div>
            <span className={labelClass}>{t("ml_model")}</span>
            <strong className="mt-1 block text-sm font-bold leading-[1.3] text-text">
              {summaryValues.ml_model}
            </strong>
          </div>
        </div>
        <div className={chipClass}>
          <MapPinIcon className="w-5 h-5 text-primary/80 shrink-0" />
          <div>
            <span className={labelClass}>{t("town")}</span>
            <strong className="mt-1 block text-sm font-bold leading-[1.3] text-text">
              {summaryValues.town}
            </strong>
          </div>
        </div>
        <div className={chipClass}>
          <HomeIcon className="w-5 h-5 text-primary/80 shrink-0" />
          <div>
            <span className={labelClass}>{t("lease_commence_date")}</span>
            <strong className="mt-1 block text-sm font-bold leading-[1.3] text-text">
              {summaryValues.lease_commence_date.year}
            </strong>
          </div>
        </div>
      </div>

      {hasOutput ? (
        /* ── Chart ── */
        <div className="border-t border-border pt-4">
          <span className="block text-[10px] font-bold uppercase tracking-[1.2px] text-text-muted">
            {t("predicted_trends")}
          </span>
          <h3 className="mb-3 mt-1 font-display text-sm font-bold tracking-[-0.02em] text-text">
            {t("chart_story_title")}
          </h3>
          <div className="mb-3.5 grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
            <div className={chipClass}>
              <span className={labelClass}>{t("chart_latest")}</span>
              <strong className="mt-1 block text-sm font-bold tracking-[-0.02em] tabular-nums break-words text-text">
                {fmt(chartStats.latestValue)}
              </strong>
            </div>
            <div className={chipClass}>
              <span className={labelClass}>{t("chart_range")}</span>
              <strong className="mt-1 block text-sm font-bold tracking-[-0.02em] tabular-nums break-words text-text">
                {fmt(chartStats.lowValue)} – {fmt(chartStats.peakValue)}
              </strong>
            </div>
            <div className={chipClass}>
              <span className={labelClass}>{t("chart_delta")}</span>
              <strong className="mt-1 block text-sm font-bold tracking-[-0.02em] tabular-nums break-words text-text">
                {chartStats.deltaValue >= 0 ? "+" : "-"}
                {fmt(Math.abs(chartStats.deltaValue))}
              </strong>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[1px] text-text-muted">
                {t("vs_12m_ago")}
              </span>
            </div>
          </div>
          <div className="relative min-h-[260px]">
            <PriceTrendChart data={trendData} locale={locale} />
          </div>
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center gap-4 px-4 py-10 text-center">
          <svg className="opacity-40" width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="28" width="10" height="28" rx="3" fill="var(--color-primary)" opacity="0.3" />
            <rect x="22" y="18" width="10" height="38" rx="3" fill="var(--color-primary)" opacity="0.5" />
            <rect x="36" y="10" width="10" height="46" rx="3" fill="var(--color-primary)" opacity="0.7" />
            <rect x="50" y="20" width="10" height="36" rx="3" fill="var(--color-primary)" opacity="0.4" />
            <line x1="4" y1="58" x2="62" y2="58" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <h3 className="font-display text-base font-bold text-text-secondary">
            {t("placeholder_title")}
          </h3>
          <p className="mx-auto max-w-[30ch] text-[13px] leading-[1.6] text-text-muted">
            {t("placeholder_body")}
          </p>
        </div>
      )}
    </div>
  );
}
