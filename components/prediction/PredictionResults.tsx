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
	locale: string;
};

export default function PredictionResults({
	output,
	summaryValues,
	t,
	trendData,
	locale
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

	const formatter = new Intl.NumberFormat(locale === 'zh' ? 'zh-SG' : 'en-SG', {
		style: 'currency',
		currency: 'SGD',
		maximumFractionDigits: 0
	});
	const fmt = (v: number) => formatter.format(Math.round(v));

	return (
		<div className="card results-panel">
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

			<div className="metric-pills">
				<div className="metric-pill">
					<span className="metric-label">{t('ml_model')}</span>
					<strong className="metric-value">{summaryValues.ml_model}</strong>
				</div>
				<div className="metric-pill">
					<span className="metric-label">{t('town')}</span>
					<strong className="metric-value">{summaryValues.town}</strong>
				</div>
				<div className="metric-pill">
					<span className="metric-label">{t('lease_commence_date')}</span>
					<strong className="metric-value">
						{summaryValues.lease_commence_date.format('YYYY')}
					</strong>
				</div>
			</div>

			{hasOutput ? (
				<div className="chart-section">
					<span className="chart-kicker">{t('predicted_trends')}</span>
					<h3 className="chart-title">{t('chart_story_title')}</h3>
					<div className="chart-summary-grid">
						<div className="chart-stat">
							<span className="metric-label">{t('chart_latest')}</span>
							<strong className="chart-stat-val">{fmt(chartStats.latestValue)}</strong>
						</div>
						<div className="chart-stat">
							<span className="metric-label">{t('chart_range')}</span>
							<strong className="chart-stat-val">
								{fmt(chartStats.lowValue)} – {fmt(chartStats.peakValue)}
							</strong>
						</div>
						<div className="chart-stat">
							<span className="metric-label">{t('chart_delta')}</span>
							<strong className="chart-stat-val">
								{chartStats.deltaValue >= 0 ? '+' : '-'}
								{fmt(Math.abs(chartStats.deltaValue))}
							</strong>
							<span className="chart-stat-sub">{t('vs_12m_ago')}</span>
						</div>
					</div>
					<div className="chart-frame">
						<PriceTrendChart data={trendData} locale={locale} />
					</div>
				</div>
			) : (
				<div className="empty-state">
					<svg className="empty-icon" width="64" height="64" viewBox="0 0 64 64" fill="none">
						<rect x="8" y="28" width="10" height="28" rx="3" fill="var(--c-primary)" opacity="0.3" />
						<rect x="22" y="18" width="10" height="38" rx="3" fill="var(--c-primary)" opacity="0.5" />
						<rect x="36" y="10" width="10" height="46" rx="3" fill="var(--c-primary)" opacity="0.7" />
						<rect x="50" y="20" width="10" height="36" rx="3" fill="var(--c-primary)" opacity="0.4" />
						<line x1="4" y1="58" x2="62" y2="58" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" />
					</svg>
					<h3 className="empty-title">{t('placeholder_title')}</h3>
					<p className="empty-body">{t('placeholder_body')}</p>
				</div>
			)}
		</div>
	);
}
