'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Statistic } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
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

	return (
		<div className={styles.resultsCard}>
			<div className={styles.resultsHeader}>
				<div>
					<span className={styles.resultsLabel}>{t('predicted_trends')}</span>
					<h2 className={styles.resultsTitle}>{t('predicted_price')}</h2>
				</div>
				<div className={styles.pricePanel}>
					<motion.div
						key={output}
						initial="initial"
						animate="animate"
						variants={valueVariants}
					>
						<Statistic
							value={output}
							precision={0}
							prefix="$"
							styles={{
								content: {
									color: theme.accent,
									fontWeight: 800,
									fontSize: isMobile ? 32 : 42
								}
							}}
							title={t('prediction')}
						/>
					</motion.div>
				</div>
			</div>

			<div className={styles.resultsGrid}>
				{[
					{ label: t('ml_model'), value: summaryValues.ml_model },
					{ label: t('town'), value: summaryValues.town },
					{
						label: t('lease_commence_date'),
						value: summaryValues.lease_commence_date.format('YYYY')
					}
				].map((item) => (
					<div key={item.label} className={styles.metricCard}>
						<span>{item.label}</span>
						<strong>{item.value}</strong>
					</div>
				))}
			</div>

			<div className={styles.chartShell}>
				<div className={styles.chartHeader}>
					<div>
						<span className={styles.chartKicker}>{t('predicted_trends')}</span>
						<h3 className={styles.chartTitle}>{t('chart_story_title')}</h3>
					</div>
					<div className={styles.chartSummaryGrid}>
						<div className={styles.chartSummaryCard}>
							<span>{t('chart_latest')}</span>
							<strong>{`$${chartStats.latestValue.toLocaleString()}`}</strong>
						</div>
						<div className={styles.chartSummaryCard}>
							<span>{t('chart_range')}</span>
							<strong>{`$${chartStats.lowValue.toLocaleString()} - $${chartStats.peakValue.toLocaleString()}`}</strong>
						</div>
						<div className={styles.chartSummaryCard}>
							<span>{t('chart_delta')}</span>
							<strong>
								{`${chartStats.deltaValue >= 0 ? '+' : '-'}$${Math.abs(chartStats.deltaValue).toLocaleString()}`}
							</strong>
							<small>{t('vs_12m_ago')}</small>
						</div>
					</div>
				</div>
				<AnimatePresence mode="wait">
					<motion.div
						key={JSON.stringify(trendData)}
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
						exit={{ opacity: 0, y: 30 }}
						className={styles.chartFrame}
					>
						<PriceTrendChart
							data={trendData}
							isMobile={isMobile}
							theme={theme}
						/>
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}
