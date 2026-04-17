'use client';

import { useId } from 'react';
import {
	Area,
	AreaChart,
	CartesianGrid,
	ReferenceDot,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis
} from 'recharts';

import type { PredictionTheme } from './theme';
import type { TrendPoint } from './types';

type PriceTrendChartProps = {
	data: TrendPoint[];
	isMobile: boolean;
	theme: PredictionTheme;
};

function formatCurrencyTick(value: number) {
	if (value >= 1_000_000) {
		return `$${(value / 1_000_000).toFixed(1)}M`;
	}

	if (value >= 1_000) {
		return `$${Math.round(value / 1_000)}k`;
	}

	return `$${Math.round(value)}`;
}

function CustomTooltip({
	active,
	label,
	payload,
	theme
}: {
	active?: boolean;
	label?: string;
	payload?: Array<{ value?: number }>;
	theme: PredictionTheme;
}) {
	if (!active || !payload?.length) {
		return null;
	}

	const value = Number(payload[0]?.value ?? 0);

	return (
		<div
			style={{
				borderRadius: 18,
				border: `1px solid ${theme.lineSoft}`,
				background: theme.panelStrong,
				boxShadow: `0 18px 40px ${theme.shadow}`,
				color: theme.text,
				padding: '12px 14px',
				minWidth: 144
			}}
		>
			<div
				style={{
					color: theme.textMuted,
					fontSize: 11,
					fontWeight: 700,
					letterSpacing: 1,
					textTransform: 'uppercase'
				}}
			>
				{label}
			</div>
			<div
				style={{
					marginTop: 6,
					fontSize: 24,
					fontWeight: 800,
					letterSpacing: '-0.03em'
				}}
			>
				{`$${value.toLocaleString()}`}
			</div>
		</div>
	);
}

export default function PriceTrendChart({
	data,
	isMobile,
	theme
}: PriceTrendChartProps) {
	const gradientId = useId().replace(/:/g, '');
	const latestPoint = data[data.length - 1];
	const peakPoint = data.reduce(
		(currentPeak, point) => (point.value > currentPeak.value ? point : currentPeak),
		data[0] ?? { label: '', value: 0 }
	);

	return (
		<ResponsiveContainer width="100%" height={isMobile ? 280 : 360}>
			<AreaChart
				data={data}
				margin={{
					top: 18,
					right: isMobile ? 8 : 18,
					left: isMobile ? -20 : -10,
					bottom: 4
				}}
			>
				<defs>
					<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={theme.chartLine} stopOpacity={0.46} />
						<stop offset="60%" stopColor={theme.chartLine} stopOpacity={0.16} />
						<stop offset="100%" stopColor={theme.chartLine} stopOpacity={0} />
					</linearGradient>
				</defs>
				<CartesianGrid
					stroke={theme.chartGrid}
					strokeDasharray="3 10"
					vertical={false}
				/>
				<XAxis
					dataKey="label"
					axisLine={false}
					tickLine={false}
					minTickGap={26}
					tick={{
						fill: theme.textMuted,
						fontSize: isMobile ? 11 : 12,
						fontFamily: 'var(--font-body), "PingFang SC", sans-serif'
					}}
				/>
				<YAxis
					axisLine={false}
					tickLine={false}
					width={isMobile ? 44 : 60}
					tick={{
						fill: theme.textMuted,
						fontSize: isMobile ? 11 : 12,
						fontFamily: 'var(--font-body), "PingFang SC", sans-serif'
					}}
					tickFormatter={formatCurrencyTick}
				/>
				<Tooltip
					cursor={{ stroke: theme.chartLine, strokeOpacity: 0.22, strokeDasharray: '4 8' }}
					content={<CustomTooltip theme={theme} />}
				/>
				{latestPoint ? (
					<ReferenceLine
						x={latestPoint.label}
						stroke={theme.chartLine}
						strokeOpacity={0.18}
						strokeDasharray="4 8"
					/>
				) : null}
				<Area
					type="monotone"
					dataKey="value"
					stroke={theme.chartLine}
					fill={`url(#${gradientId})`}
					strokeWidth={3}
					isAnimationActive
					dot={false}
					activeDot={{
						r: 5,
						stroke: theme.chartLine,
						strokeWidth: 2,
						fill: theme.panelStrong
					}}
				/>
				{peakPoint ? (
					<ReferenceDot
						x={peakPoint.label}
						y={peakPoint.value}
						r={5}
						fill={theme.primary}
						stroke={theme.panelStrong}
						strokeWidth={2}
					/>
				) : null}
				{latestPoint ? (
					<ReferenceDot
						x={latestPoint.label}
						y={latestPoint.value}
						r={6}
						fill={theme.accent}
						stroke={theme.panelStrong}
						strokeWidth={2.5}
					/>
				) : null}
			</AreaChart>
		</ResponsiveContainer>
	);
}
