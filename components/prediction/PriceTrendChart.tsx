'use client';

import { useId } from 'react';
import {
	Area,
	AreaChart,
	CartesianGrid,
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

export default function PriceTrendChart({
	data,
	isMobile,
	theme
}: PriceTrendChartProps) {
	const gradientId = useId().replace(/:/g, '');

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
						<stop offset="0%" stopColor={theme.chartLine} stopOpacity={0.38} />
						<stop offset="65%" stopColor={theme.chartLine} stopOpacity={0.12} />
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
					contentStyle={{
						borderRadius: 18,
						border: `1px solid ${theme.lineSoft}`,
						background: theme.panelStrong,
						boxShadow: `0 18px 40px ${theme.shadow}`,
						color: theme.text,
						padding: '10px 12px'
					}}
					labelStyle={{
						color: theme.textMuted,
						fontSize: 11,
						fontWeight: 700,
						letterSpacing: 1
					}}
					formatter={(value) => [
						`$${Number(value ?? 0).toLocaleString()}`,
						'Estimated Price'
					]}
				/>
				<Area
					type="monotone"
					dataKey="value"
					stroke={theme.chartLine}
					fill={`url(#${gradientId})`}
					strokeWidth={2.75}
					isAnimationActive
					activeDot={{
						r: 4,
						stroke: theme.chartLine,
						strokeWidth: 2,
						fill: theme.panelStrong
					}}
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
}
