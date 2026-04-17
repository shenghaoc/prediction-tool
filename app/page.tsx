'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title as chartTitle,
	Tooltip,
	Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { App as AntdApp, Form, Select, InputNumber, Button, Statistic, Grid } from 'antd';
import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import { useTranslation } from 'react-i18next';
import './i18n';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import {
	ML_MODELS,
	TOWNS,
	STOREY_RANGES,
	FLAT_MODELS,
	type MLModel,
	type Town,
	type StoreyRange,
	type FlatModel
} from '../lib/lists';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	chartTitle,
	Tooltip,
	Legend
);

const chartOptions: ChartOptions<'line'> = {
	responsive: true,
	plugins: {
		legend: {
			position: 'top' as const
		},
		title: {
			display: false,
			text: 'Predicted Trends for Past 12 Months'
		}
	},
	animation: {
		duration: 800,
		easing: 'easeInOutQuart' as const // Chart.js expects a specific literal type
	}
};

const initialFormValues: FieldType = {
	ml_model: ML_MODELS[0],
	town: TOWNS[0],
	storey_range: STOREY_RANGES[0],
	flat_model: FLAT_MODELS[0],
	floor_area_sqm: 20,
	lease_commence_date: dayjs.utc('2022-02', 'YYYY-MM')
};

const defaultLabels = [...Array(13).keys()].reverse().map((x) => initialFormValues.lease_commence_date.subtract(x, 'month').format('YYYY-MM'));

const defaultChartConfig: ChartData<'line'> = {
	labels: defaultLabels,
	datasets: [
		{
			label: 'Sample Trends',
			data: defaultLabels.map(() => 0.0),
			borderColor: 'rgb(255, 99, 132)',
			backgroundColor: 'rgba(255, 99, 132, 0.5)'
		}
	]
};

const { Option } = Select;

export type FieldType = {
	ml_model: MLModel;
	town: Town;
	storey_range: StoreyRange;
	flat_model: FlatModel;
	floor_area_sqm: number;
	lease_commence_date: Dayjs;
};

type ApiResponse = { labels: string; data: number }[];
type PersistedFieldValues = Omit<Partial<FieldType>, 'lease_commence_date'> & {
	lease_commence_date?: string;
};
type SummaryValues = Pick<FieldType, 'ml_model' | 'town' | 'lease_commence_date'>;

function getErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error && error.message ? error.message : fallback;
}

export default function Home() {
	const { message: messageApi } = AntdApp.useApp();
	const { t, i18n } = useTranslation();
	const screens = Grid.useBreakpoint();
	const [mounted, setMounted] = useState(false);
	const [darkMode, setDarkMode] = useState(false);
	const isMobile = mounted ? !screens.md : false;

	useEffect(() => {
		setMounted(true);
		if (localStorage.getItem('theme') === 'dark') {
			setDarkMode(true);
		}
	}, []);

	useEffect(() => {
		if (!mounted) {
			return;
		}

		document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
		localStorage.setItem('theme', darkMode ? 'dark' : 'light');
	}, [darkMode, mounted]);
	const curr = initialFormValues.lease_commence_date;

	const [output, setOutput] = useState(0.0);
	const [config, setConfig] = useState<ChartData<'line'>>(defaultChartConfig);
	const [loading, setLoading] = useState(false);
	const [summaryValues, setSummaryValues] = useState<SummaryValues>({
		ml_model: initialFormValues.ml_model,
		town: initialFormValues.town,
		lease_commence_date: initialFormValues.lease_commence_date
	});
	const [form] = Form.useForm<FieldType>();
	const chartRef = useRef(null);

	// --- Persistence: Load on mount ---
	useEffect(() => {
		// Language
		const savedLang = typeof window !== 'undefined' && localStorage.getItem('lang');
		if (savedLang && savedLang !== i18n.language) {
			i18n.changeLanguage(savedLang);
		}
		// Form
		const savedForm = typeof window !== 'undefined' && localStorage.getItem('form');
		if (savedForm) {
			try {
				const parsed = JSON.parse(savedForm) as PersistedFieldValues;
				const restoredValues: Partial<FieldType> = {
					...parsed,
					lease_commence_date: parsed.lease_commence_date
						? dayjs(parsed.lease_commence_date)
						: undefined
				};
				form.setFieldsValue(restoredValues);
				setSummaryValues({
					ml_model: restoredValues.ml_model ?? initialFormValues.ml_model,
					town: restoredValues.town ?? initialFormValues.town,
					lease_commence_date: restoredValues.lease_commence_date ?? initialFormValues.lease_commence_date
				});
			} catch {}
		}
	}, [form, i18n]);

	// --- Persistence: Save on change ---
	const handleFormChange = useCallback((_: unknown, allValues: Partial<FieldType>) => {
		const persist: PersistedFieldValues = {
			...allValues,
			lease_commence_date: allValues.lease_commence_date?.toISOString()
		};
		localStorage.setItem('form', JSON.stringify(persist));
		setSummaryValues({
			ml_model: allValues.ml_model ?? initialFormValues.ml_model,
			town: allValues.town ?? initialFormValues.town,
			lease_commence_date: allValues.lease_commence_date ?? initialFormValues.lease_commence_date
		});
	}, []);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('lang', i18n.language);
		}
	}, [i18n.language]);

	const disabledYear = useCallback((current: Dayjs) => {
		return current.isBefore('1960-01-01') || current.isAfter('2022-01-01', 'year');
	}, []);

	const handleReset = useCallback(() => {
		form.setFieldsValue(initialFormValues);
		setOutput(0.0);
		setConfig(defaultChartConfig);
		setSummaryValues({
			ml_model: initialFormValues.ml_model,
			town: initialFormValues.town,
			lease_commence_date: initialFormValues.lease_commence_date
		});
		if (typeof window !== 'undefined') {
			localStorage.removeItem('form');
		}
	}, [form]);

	const handleFinish = useCallback(async (values: FieldType) => {
		setLoading(true);
		const formData = new FormData();
		formData.append('ml_model', values.ml_model);
		formData.append('month_start', curr.subtract(12, 'month').format('YYYY-MM'));
		formData.append('month_end', curr.format('YYYY-MM'));
		formData.append('town', values.town);
		formData.append('storey_range', values.storey_range);
		formData.append('flat_model', values.flat_model);
		formData.append('floor_area_sqm', values.floor_area_sqm.toString());
		formData.append('lease_commence_date', dayjs(values.lease_commence_date).year().toString());
		try {
			const response = await fetch(
				'https://ee4802-g20-tool.shenghaoc.workers.dev/api/prices',
				{
					method: 'POST',
					body: formData
				}
			);
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`API request failed: ${errorText}`);
			}
			const server_data: ApiResponse = await response.json();
			setConfig({
				labels: server_data.map((x) => x.labels),
				datasets: [
					{
						label: 'Trends',
						data: server_data.map((x) => x.data),
						borderColor: 'rgb(53, 162, 235)',
						backgroundColor: 'rgba(53, 162, 235, 0.5)'
					}
				]
			});
			setOutput(server_data[server_data.length - 1]?.data ?? 0.0);
		} catch (error: unknown) {
			messageApi.error(getErrorMessage(error, t('error_fetch')));
		} finally {
			setLoading(false);
		}
	}, [curr, messageApi, t]);

	// Animation variants
	const cardVariants = {
		hidden: { opacity: 0, y: 40 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
	};
	const chartVariants = {
		hidden: { opacity: 0, y: 30 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
	};
	const valueVariants = {
		initial: { scale: 1, color: darkMode ? '#ffe066' : '#2563eb' },
		animate: { scale: [1, 1.2, 1], color: darkMode ? '#ffe066' : '#2563eb', transition: { duration: 0.6 } },
	};
	const theme = darkMode
		? {
				text: '#f2ede6',
				textMuted: '#9e998f',
				primary: '#8daec1',
				accent: '#cf8b60',
				lineSoft: 'rgba(141, 174, 193, 0.16)',
				panelBg: 'rgba(16, 23, 31, 0.78)',
				panelStrong: 'rgba(18, 27, 37, 0.88)',
				resultsBg: 'rgba(18, 26, 35, 0.92)',
				resultsBg2: 'rgba(15, 22, 30, 0.86)',
				pricePanelBg: 'rgba(255, 255, 255, 0.04)',
				fieldBg: 'rgba(255, 255, 255, 0.04)',
				focusRing: 'rgba(141, 174, 193, 0.14)',
				shadow: 'rgba(0, 0, 0, 0.32)',
				accentShadow: 'rgba(207, 139, 96, 0.26)',
				meshLine: 'rgba(255, 255, 255, 0.06)',
				orbColor: 'rgba(207, 139, 96, 0.18)',
				chartGrid: 'rgba(255,255,255,0.08)',
				chartLine: '#cf8b60',
				chartFill: 'rgba(207, 139, 96, 0.16)'
			}
		: {
				text: '#1f2328',
				textMuted: '#74685b',
				primary: '#234b61',
				accent: '#af6542',
				lineSoft: 'rgba(116, 92, 68, 0.14)',
				panelBg: 'rgba(255, 250, 244, 0.72)',
				panelStrong: 'rgba(255, 253, 250, 0.82)',
				resultsBg: 'rgba(255, 252, 248, 0.9)',
				resultsBg2: 'rgba(249, 243, 236, 0.84)',
				pricePanelBg: 'rgba(255, 255, 255, 0.46)',
				fieldBg: 'rgba(255, 255, 255, 0.54)',
				focusRing: 'rgba(35, 75, 97, 0.12)',
				shadow: 'rgba(110, 84, 63, 0.12)',
				accentShadow: 'rgba(175, 101, 66, 0.24)',
				meshLine: 'rgba(31, 35, 40, 0.04)',
				orbColor: 'rgba(175, 101, 66, 0.14)',
				chartGrid: 'rgba(31, 35, 40, 0.08)',
				chartLine: '#af6542',
				chartFill: 'rgba(175, 101, 66, 0.12)'
			};

	useEffect(() => {
		setConfig((current) => ({
			...current,
			datasets: current.datasets.map((dataset) => ({
				...dataset,
				borderColor: theme.chartLine,
				backgroundColor: theme.chartFill,
				pointBackgroundColor: theme.chartLine,
				pointBorderColor: theme.chartLine,
				tension: 0.35,
				fill: true
			}))
		}));
	}, [darkMode, theme.chartFill, theme.chartLine]);

	const dynamicChartOptions: ChartOptions<'line'> = {
		...chartOptions,
		interaction: {
			mode: 'index',
			intersect: false
		},
		elements: {
			line: {
				borderWidth: 2.5
			},
			point: {
				radius: 0,
				hoverRadius: 4
			}
		},
		scales: {
			x: {
				ticks: {
					color: theme.textMuted
				},
				grid: {
					color: theme.chartGrid
				}
			},
			y: {
				ticks: {
					color: theme.textMuted
				},
				grid: {
					color: theme.chartGrid
				}
			}
		},
		plugins: {
			...chartOptions.plugins,
			legend: {
				display: false
			}
		}
	};

	return (
		<main style={{
			minHeight: '100vh',
			padding: isMobile ? '18px 14px 30px' : '26px 28px 42px',
			background: darkMode
				? 'linear-gradient(155deg, #091017 0%, #101821 52%, #1a2430 100%)'
				: 'linear-gradient(155deg, #f5eee5 0%, #eee4d8 50%, #ece6de 100%)',
			transition: 'background 0.45s ease',
			['--page-bg' as string]: darkMode ? '#091017' : '#f5eee5',
			['--text-color' as string]: theme.text,
			['--muted-color' as string]: theme.textMuted,
			['--primary-color' as string]: theme.primary,
			['--accent-color' as string]: theme.accent,
			['--line-soft' as string]: theme.lineSoft,
			['--panel-bg' as string]: theme.panelBg,
			['--panel-strong' as string]: theme.panelStrong,
			['--results-bg' as string]: theme.resultsBg,
			['--results-bg-2' as string]: theme.resultsBg2,
			['--price-panel-bg' as string]: theme.pricePanelBg,
			['--field-bg' as string]: theme.fieldBg,
			['--pill-bg' as string]: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 251, 246, 0.56)',
			['--focus-ring' as string]: theme.focusRing,
			['--panel-shadow' as string]: theme.shadow,
			['--accent-shadow' as string]: theme.accentShadow,
			['--mesh-line' as string]: theme.meshLine,
			['--orb-color' as string]: theme.orbColor
		}} className="prediction-shell">
			<div className="prediction-surface" style={{ maxWidth: 1280, margin: '0 auto' }}>
				<div className="prediction-topbar">
					<div className="prediction-pill">{t('hero_eyebrow')}</div>
					<div className="prediction-actions">
						<Button
							className="prediction-ghost-btn"
							icon={darkMode ? <BulbFilled /> : <BulbOutlined />}
							onClick={() => setDarkMode((value) => !value)}
							aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
						/>
						<Button
							className="prediction-ghost-btn"
							size="small"
							onClick={() => {
								const nextLang = i18n.language === 'en' ? 'zh' : 'en';
								i18n.changeLanguage(nextLang);
								localStorage.setItem('lang', nextLang);
							}}
						>
							{t('switch_language')}
						</Button>
					</div>
				</div>

				<div className="prediction-layout">
					<AnimatePresence>
						<motion.div
							key="form-card"
							initial="hidden"
							animate="visible"
							exit="hidden"
							variants={cardVariants}
							className="prediction-panel"
						>
							<div className="prediction-card">
								<div className="prediction-card-inner prediction-hero">
									<div>
										<h1 className="prediction-headline">{t('price_prediction')}</h1>
										<p className="prediction-lead">{t('hero_blurb')}</p>
										<div className="prediction-figure-row">
											{[
												{ label: t('ml_model'), value: ML_MODELS.length.toString().padStart(2, '0') },
												{ label: t('town'), value: TOWNS.length.toString().padStart(2, '0') },
												{ label: t('flat_model'), value: FLAT_MODELS.length.toString().padStart(2, '0') }
											].map((item) => (
												<div key={item.label} className="prediction-figure">
													<span className="prediction-figure-label">{item.label}</span>
													<strong className="prediction-figure-value">{item.value}</strong>
												</div>
											))}
										</div>
										<p className="prediction-caption">{t('hero_caption')}</p>
									</div>

									<div className="prediction-form-shell">
										<h2 className="prediction-section-title">{t('prediction_form')}</h2>
										<Form
											form={form}
											layout="vertical"
											initialValues={initialFormValues}
											onFinish={handleFinish}
											onValuesChange={handleFormChange}
										>
											<div className="prediction-form-grid">
												<Form.Item<FieldType>
													name="ml_model"
													label={t('ml_model')}
													rules={[{ required: true, message: t('choose_ml_model') }]}
												>
													<Select placeholder={t('select_ml_model')} autoFocus aria-label={t('ml_model')} size="large">
														{ML_MODELS.map((ml_model) => (
															<Option key={ml_model} value={ml_model}>
																{t(`ml_models.${ml_model}`, ml_model)}
															</Option>
														))}
													</Select>
												</Form.Item>
												<Form.Item<FieldType>
													name="town"
													label={t('town')}
													rules={[{ required: true, message: t('missing_town') }]}
												>
													<Select placeholder={t('select_town')} aria-label={t('town')} size="large">
														{TOWNS.map((town) => (
															<Option key={town} value={town}>
																{t(`towns.${town}`, town)}
															</Option>
														))}
													</Select>
												</Form.Item>
												<Form.Item<FieldType>
													name="storey_range"
													label={t('storey_range')}
													rules={[{ required: true, message: t('missing_storey_range') }]}
												>
													<Select placeholder={t('select_storey_range')} aria-label={t('storey_range')} size="large">
														{STOREY_RANGES.map((storey_range) => (
															<Option key={storey_range} value={storey_range}>
																{t(`storey_ranges.${storey_range}`, storey_range)}
															</Option>
														))}
													</Select>
												</Form.Item>
												<Form.Item<FieldType>
													name="flat_model"
													label={t('flat_model')}
													rules={[{ required: true, message: t('missing_flat_model') }]}
												>
													<Select placeholder={t('select_flat_model')} aria-label={t('flat_model')} size="large">
														{FLAT_MODELS.map((flat_model) => (
															<Option key={flat_model} value={flat_model}>
																{t(`flat_models.${flat_model}`, flat_model)}
															</Option>
														))}
													</Select>
												</Form.Item>
												<Form.Item<FieldType>
													className="prediction-field-full"
													name="floor_area_sqm"
													label={t('floor_area')}
													rules={[
														{ required: true, message: t('missing_floor_area') },
														{ type: 'number', min: 20, max: 300, message: t('floor_area_range') }
													]}
												>
													<div className="prediction-unit-wrap">
														<InputNumber
															type="number"
															min={20}
															max={300}
															style={{ width: '100%' }}
															placeholder={t('enter_floor_area')}
															aria-label={t('floor_area')}
															size="large"
														/>
														<div className="prediction-unit-tag">m²</div>
													</div>
												</Form.Item>
												<Form.Item<FieldType>
													className="prediction-field-full"
													name="lease_commence_date"
													label={t('lease_commence_date')}
													rules={[{ required: true, message: t('missing_lease_commence_date') }]}
												>
													<DatePicker picker="year" inputReadOnly={true} disabledDate={disabledYear} style={{ width: '100%' }} placeholder={t('select_year')} aria-label={t('lease_commence_date')} size="large" />
												</Form.Item>
												<div className="prediction-button-row prediction-field-full">
										<Button
											className="prediction-primary-btn"
											style={{
												flex: 1,
												boxShadow: darkMode ? '0 14px 28px rgba(141, 174, 193, 0.16)' : '0 16px 30px rgba(175, 101, 66, 0.24)'
											}}
											type="primary"
											htmlType="submit"
											loading={loading}
											disabled={loading}
											aria-label={t('get_prediction')}
											block
										>
											{t('get_prediction')}
										</Button>
										<Button
											className="prediction-reset-btn"
											style={{ flex: 1 }}
											onClick={handleReset}
											disabled={loading}
											aria-label={t('reset_form')}
										>
											{t('reset_form')}
										</Button>
												</div>
											</div>
										</Form>
									</div>
								</div>
							</div>
						</motion.div>
					</AnimatePresence>

					<AnimatePresence mode="wait">
						<motion.div
							key="chart-card"
							initial="hidden"
							animate="visible"
							exit="hidden"
							variants={cardVariants}
							className="prediction-results-panel"
						>
							<div className="prediction-results-card">
								<div className="prediction-results-header">
										<div>
											<span className="prediction-results-label">{t('predicted_trends')}</span>
											<h2 className="prediction-results-title">{t('predicted_price')}</h2>
										</div>
										<div className="prediction-price-panel">
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

									<div className="prediction-results-grid">
										{[
											{ label: t('ml_model'), value: summaryValues.ml_model },
											{ label: t('town'), value: summaryValues.town },
											{ label: t('lease_commence_date'), value: summaryValues.lease_commence_date.format('YYYY') }
										].map((item) => (
											<div key={item.label} className="prediction-metric-card">
												<span>{item.label}</span>
												<strong>{item.value}</strong>
											</div>
										))}
									</div>

									<div className="prediction-chart-shell">
										<AnimatePresence mode="wait">
											<motion.div
												key={JSON.stringify(config.labels)}
												initial="hidden"
												animate="visible"
												exit="hidden"
												variants={chartVariants}
												className="prediction-chart-frame"
											>
												<Line ref={chartRef} options={dynamicChartOptions} data={config} style={{ maxHeight: isMobile ? 260 : 360, width: '100%' }} />
											</motion.div>
										</AnimatePresence>
									</div>
							</div>
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</main>
	);
}
