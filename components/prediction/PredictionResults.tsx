"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { TFunction } from "../../lib/i18n";
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
    "rounded-input border px-3.5 py-3 bg-input-bg border-border";

  return (
    <div className="flex flex-col gap-5 rounded-card border border-border bg-surface shadow-card transition-[background,border-color,box-shadow] duration-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/30 via-primary to-primary/60" />
      <div className="flex flex-col gap-5 p-6 max-sm:p-4">
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
        <div className={`min-w-[180px] rounded-input border px-5 py-3.5 max-sm:w-full${
          hasOutput
            ? " border-primary/20 bg-gradient-to-br from-primary-subtle to-primary-bg"
            : " border-primary-muted bg-primary-subtle"
        }`}>
          <span className="block text-[10px] font-bold uppercase tracking-[1.2px] text-text-muted">
            {t("prediction")}
          </span>
          <strong
            key={output}
            className={`mt-1.5 block text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold leading-[1.1] tracking-[-0.03em] tabular-nums${
              hasOutput
                ? " text-primary animate-settle"
                : " text-[0.95rem] tracking-[-0.02em] text-text-muted"
            }`}
          >
            {hasOutput ? fmt(output) : t("awaiting")}
          </strong>
        </div>
      </div>

      {/* ── Metric pills ── */}
      <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
        <div className="rounded-input border border-primary-muted bg-primary-bg px-3.5 py-3">
          <span className={labelClass}>{t("ml_model")}</span>
          <strong className="mt-1 block text-sm font-bold leading-[1.3] text-text">
            {summaryValues.ml_model}
          </strong>
        </div>
        <div className="rounded-input border border-primary-muted bg-primary-bg px-3.5 py-3">
          <span className={labelClass}>{t("town")}</span>
          <strong className="mt-1 block text-sm font-bold leading-[1.3] text-text">
            {summaryValues.town}
          </strong>
        </div>
        <div className="rounded-input border border-primary-muted bg-primary-bg px-3.5 py-3">
          <span className={labelClass}>{t("lease_commence_date")}</span>
          <strong className="mt-1 block text-sm font-bold leading-[1.3] text-text">
            {summaryValues.lease_commence_date.year}
          </strong>
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
        <div className="flex flex-col items-center justify-center gap-5 px-4 py-12 text-center">
          <div className="relative">
            <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true">
              <circle cx="44" cy="40" r="36" fill="var(--color-primary)" opacity="0.04" />
              <circle cx="44" cy="40" r="24" fill="var(--color-primary)" opacity="0.06" />
              <path d="M22 54V34l14-11v4h-2v2h2v6h-2v2h2v17H22z" fill="var(--color-primary)" opacity="0.15" />
              <path d="M36 27l14 11v16h-4V42h-6v12h-4V27z" fill="var(--color-primary)" opacity="0.3" />
              <path d="M50 38v16h4V34L40 23l-4 3.2" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
              <path d="M24 62l8-6 6 2 8-12 6-4 8-10" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 4" opacity="0.5" />
              <path d="M56 30l4 2-2 4" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" fill="none" />
              <circle cx="60" cy="32" r="3.5" fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth="2" opacity="0.8" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-text-secondary">
              {t("placeholder_title")}
            </h3>
            <p className="mx-auto mt-2 max-w-[30ch] text-[13px] leading-[1.6] text-text-muted">
              {t("placeholder_body")}
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
