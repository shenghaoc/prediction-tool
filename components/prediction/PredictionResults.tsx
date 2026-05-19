'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { TFunction } from 'i18next';

import type { SummaryValues, TrendPoint } from './types';

const PriceTrendChart = dynamic(() => import('./PriceTrendChart'), {
	ssr: false,
	loading: () => <div className="chart-frame" />
});

type PredictionResultsProps = {
	output: number;
	summaryValues: SummaryValues;
	t: TFunction;
	trendData: TrendPoint[];
};

export default function PredictionResults({
	output,
	summaryValues,
	t,
	trendData,
}: PredictionResultsProps) {
	const hasOutput = output > 0;

	const chartStats = useMemo(() => {
		const latestValue = trendData[trendData.length - 1]?.value ?? 0;
		const firstValue = trendData[0]?.value ?? 0;
		const peakValue = Math.max(...trendData.map((point) => point.value), 0);
		const lowValue = trendData.reduce(
			(currentLowest, point) =>
				point.value > 0 ? Math.min(currentLowest, point.value) : currentLowest,
			Number.POSITIVE_INFINITY
		);
		const deltaValue = latestValue - firstValue;

		return {
			latestValue,
			peakValue,
			lowValue: Number.isFinite(lowValue) ? lowValue : 0,
			deltaValue
		};
	}, [trendData]);

	const fmt = (v: number) =>
		v.toLocaleString('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 });

	return (
		<div className="results-card">
			<div className="results-header">
				<div>
					<span className="results-label">{t('predicted_trends')}</span>
					<h2 className="results-title">{t('predicted_price')}</h2>
				</div>
				<div className="price-panel">
					<span className="results-label">{t('prediction')}</span>
					<strong 
						key={output}
						className={`price-value${hasOutput ? ' has-value' : ' awaiting'}`}
					>
						{hasOutput ? fmt(output) : t('awaiting')}
					</strong>
				</div>
			</div>

			<div className="metric-grid">
				<div className="metric-card">
					<span className="metric-label">{t('ml_model')}</span>
					<strong className="metric-value">{summaryValues.ml_model}</strong>
				</div>
				<div className="metric-card">
					<span className="metric-label">{t('town')}</span>
					<strong className="metric-value">{summaryValues.town}</strong>
				</div>
				<div className="metric-card">
					<span className="metric-label">{t('lease_commence_date')}</span>
					<strong className="metric-value">
						{summaryValues.lease_commence_date.format('YYYY')}
					</strong>
				</div>
			</div>

			{hasOutput ? (
				<div className="chart-shell">
					<span className="chart-kicker">{t('predicted_trends')}</span>
					<h3 className="chart-title">{t('chart_story_title')}</h3>
					<div className="chart-summary-grid">
						<div className="chart-summary-card">
							<span className="metric-label">{t('chart_latest')}</span>
							<strong className="chart-summary-val">{fmt(chartStats.latestValue)}</strong>
						</div>
						<div className="chart-summary-card">
							<span className="metric-label">{t('chart_range')}</span>
							<strong className="chart-summary-val">
								{fmt(chartStats.lowValue)} – {fmt(chartStats.peakValue)}
							</strong>
						</div>
						<div className="chart-summary-card">
							<span className="metric-label">{t('chart_delta')}</span>
							<strong className="chart-summary-val">
								{chartStats.deltaValue >= 0 ? '+' : '-'}
								{fmt(Math.abs(chartStats.deltaValue))}
							</strong>
							<span className="chart-summary-sub">{t('vs_12m_ago')}</span>
						</div>
					</div>
					<div className="chart-frame">
						<PriceTrendChart data={trendData} />
					</div>
				</div>
			) : (
				<div className="placeholder">
					<h3 className="placeholder-title">{t('placeholder_title')}</h3>
					<p className="placeholder-body">{t('placeholder_body')}</p>
				</div>
			)}
		</div>
	);
}
