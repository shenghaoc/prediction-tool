'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Card, Descriptions, Divider, Flex, Statistic, Typography } from 'antd';
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
	const summaryItems = useMemo(
		() => [
			{
				key: 'ml-model',
				label: t('ml_model'),
				children: summaryValues.ml_model
			},
			{
				key: 'town',
				label: t('town'),
				children: summaryValues.town
			},
			{
				key: 'lease',
				label: t('lease_commence_date'),
				children: summaryValues.lease_commence_date.format('YYYY')
			}
		],
		[summaryValues.lease_commence_date, summaryValues.ml_model, summaryValues.town, t]
	);
	const chartSummaryItems = useMemo(
		() => [
			{
				key: 'latest',
				label: t('chart_latest'),
				value: `$${chartStats.latestValue.toLocaleString()}`
			},
			{
				key: 'range',
				label: t('chart_range'),
				value: `$${chartStats.lowValue.toLocaleString()} - $${chartStats.peakValue.toLocaleString()}`
			},
			{
				key: 'delta',
				label: t('chart_delta'),
				value: `${chartStats.deltaValue >= 0 ? '+' : '-'}$${Math.abs(chartStats.deltaValue).toLocaleString()}`,
				caption: t('vs_12m_ago')
			}
		],
		[chartStats.deltaValue, chartStats.latestValue, chartStats.lowValue, chartStats.peakValue, t]
	);

	return (
		<Card className={styles.resultsCard} variant="borderless">
			<Flex
				className={styles.resultsHeader}
				justify="space-between"
				align={isMobile ? 'stretch' : 'flex-start'}
				gap="large"
				wrap
			>
				<Flex vertical gap={6}>
					<Typography.Text className={styles.resultsLabel}>
						{t('predicted_trends')}
					</Typography.Text>
					<Typography.Title level={2} className={styles.resultsTitle}>
						{t('predicted_price')}
					</Typography.Title>
				</Flex>
				<Card className={styles.pricePanel} variant="borderless">
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
				</Card>
			</Flex>

			<Descriptions
				className={styles.resultsMeta}
				column={isMobile ? 1 : 3}
				colon={false}
				items={summaryItems}
				layout="vertical"
			/>

			<Divider className={styles.resultsDivider} />

			<Flex
				className={styles.chartHeader}
				justify="space-between"
				align={isMobile ? 'stretch' : 'flex-start'}
				gap="middle"
				wrap
			>
				<Flex vertical gap={6}>
					<Typography.Text className={styles.chartKicker}>
						{t('predicted_trends')}
					</Typography.Text>
					<Typography.Title level={3} className={styles.chartTitle}>
						{t('chart_story_title')}
					</Typography.Title>
				</Flex>
				<div className={styles.chartSummaryGrid}>
					{chartSummaryItems.map((item) => (
						<Card
							key={item.key}
							className={styles.chartSummaryCard}
							size="small"
							variant="borderless"
						>
							<Statistic
								title={item.label}
								value={item.value}
								formatter={(value) => (
									<span className={styles.chartSummaryValue}>{String(value)}</span>
								)}
							/>
							{item.caption ? (
								<Typography.Text className={styles.chartSummaryCaption}>
									{item.caption}
								</Typography.Text>
							) : null}
						</Card>
					))}
				</div>
			</Flex>
			<div className={styles.chartFrame}>
				<PriceTrendChart
					data={trendData}
					isMobile={isMobile}
					theme={theme}
				/>
			</div>
		</Card>
	);
}
