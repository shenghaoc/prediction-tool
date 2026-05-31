"use client";

import { useId, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TrendPoint } from "./types";

type PriceTrendChartProps = {
  data: TrendPoint[];
  locale: string;
};

const sliceMonth = (value: string) => value.slice(5);

const chartConfig = {
  value: {
    label: "Price",
    theme: {
      light: "var(--chart-1)",
      dark: "var(--chart-1)",
    },
  },
} satisfies ChartConfig;

export default function PriceTrendChart({ data, locale }: PriceTrendChartProps) {
  const uniqueId = useId();
  const fillGradientId = `chart-grad-${uniqueId.replace(/:/g, "")}`;

  const { formatCurrency, formatAxis } = useMemo(() => {
    const f = new Intl.NumberFormat(locale === "zh" ? "zh-SG" : "en-SG", {
      style: "currency",
      currency: "SGD",
      maximumFractionDigits: 0,
    });
    const fmtCurrency = (value: number) => f.format(Math.round(value));
    const fmtAxis = (value: number) => {
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
      return fmtCurrency(value);
    };
    return { formatCurrency: fmtCurrency, formatAxis: fmtAxis };
  }, [locale]);

  if (!data.length) return null;

  return (
    <ChartContainer config={chartConfig} className="min-h-[260px] w-full">
      <AreaChart
        data={data}
        margin={{ top: 12, right: 12, left: 4, bottom: 0 }}
        accessibilityLayer
      >
        <defs>
          <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.28} />
            <stop offset="60%" stopColor="var(--color-value)" stopOpacity={0.06} />
            <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 4" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={sliceMonth}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={56}
          tickFormatter={formatAxis}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--color-value)", strokeOpacity: 0.18, strokeDasharray: "3 6" }}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(label) => String(label)}
              formatter={(value) => formatCurrency(Number(value))}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2.5}
          fill={`url(#${fillGradientId})`}
          dot={{ r: 3, fill: "var(--color-value)", strokeWidth: 0 }}
          activeDot={{
            r: 5,
            fill: "var(--background)",
            stroke: "var(--color-value)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
