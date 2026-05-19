'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Card, Divider } from 'antd';
import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';

import styles from './styles.module.css';
import type { PredictionTheme } from './theme';
import type { SummaryValues, TrendPoint } from './types';

const PriceTrendChart = dynamic(() => import('./PriceTrendChart'), {
	ssr: false,
	loading: () => <div className={styles.chartFrame} />
});

type PredictionResultsProps = {
	isMobile: boolean;
	output: number;
	summaryValues: SummaryValues;
	t: TFunction;
	theme: PredictionTheme;
	trendData: TrendPoint[];
	valueVariants: {
		initial: { scale: number; color: string };
		animate: {
			scale: number[];
			color: string;
			transition: { duration: number };
		};
	};
};

export default function PredictionResults({
	isMobile,
	output,
	summaryValues,
	t,
	theme,
	trendData,
	valueVariants
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

	const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;

	return (
		<Card className={styles.resultsCard} variant="borderless">
			{/* Header */}
			<div className={styles.resultsHeader}>
				<div>
					<span className={styles.resultsLabel}>{t('predicted_trends')}</span>
					<h2 className={styles.resultsTitle}>{t('predicted_price')}</h2>
				</div>
				<div className={styles.pricePanel}>
					<span className={styles.pricePanelLabel}>{t('prediction')}</span>
					<motion.strong
						key={output}
						initial="initial"
						animate="animate"
						variants={valueVariants}
						className={`${styles.priceValue}${hasOutput ? '' : ` ${styles.priceValueAwaiting}`}`}
					>
						{hasOutput ? fmt(output) : t('awaiting')}
					</motion.strong>
				</div>
			</div>

			{/* Metric grid */}
			<div className={styles.metricGrid}>
				<div className={styles.metricCard}>
					<span className={styles.metricLabel}>{t('ml_model')}</span>
					<strong className={styles.metricValue}>{summaryValues.ml_model}</strong>
				</div>
				<div className={styles.metricCard}>
					<span className={styles.metricLabel}>{t('town')}</span>
					<strong className={styles.metricValue}>{summaryValues.town}</strong>
				</div>
				<div className={styles.metricCard}>
					<span className={styles.metricLabel}>{t('lease_commence_date')}</span>
					<strong className={styles.metricValue}>
						{summaryValues.lease_commence_date.format('YYYY')}
					</strong>
				</div>
			</div>

			{hasOutput ? (
				<div className={styles.chartShell}>
					<span className={styles.chartKicker}>{t('predicted_trends')}</span>
					<h3 className={styles.chartTitle}>{t('chart_story_title')}</h3>

					<div className={styles.chartSummaryGrid}>
						<div className={styles.chartSummaryCard}>
							<span className={styles.metricLabel}>{t('chart_latest')}</span>
							<strong className={styles.chartSummaryVal}>
								{fmt(chartStats.latestValue)}
							</strong>
						</div>
						<div className={styles.chartSummaryCard}>
							<span className={styles.metricLabel}>{t('chart_range')}</span>
							<strong className={styles.chartSummaryVal}>
								{fmt(chartStats.lowValue)} – {fmt(chartStats.peakValue)}
							</strong>
						</div>
						<div className={styles.chartSummaryCard}>
							<span className={styles.metricLabel}>{t('chart_delta')}</span>
							<strong className={styles.chartSummaryVal}>
								{chartStats.deltaValue >= 0 ? '+' : '-'}
								{fmt(Math.abs(chartStats.deltaValue))}
							</strong>
							<span className={styles.chartSummarySub}>{t('vs_12m_ago')}</span>
						</div>
					</div>

					<div className={styles.chartFrame}>
						<PriceTrendChart data={trendData} isMobile={isMobile} theme={theme} />
					</div>
				</div>
			) : (
				<div className={styles.placeholder}>
					<h3 className={styles.placeholderTitle}>{t('placeholder_title')}</h3>
					<p className={styles.placeholderBody}>{t('placeholder_body')}</p>
				</div>
			)}
		</Card>
	);
}
