'use client';
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
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
import { Form, Select, InputNumber, Button, Typography, Statistic, Col, Row, Divider, message, Card, Space, Grid } from 'antd';
import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import '../app/i18n';
import { useTranslation } from 'react-i18next';
import './i18n';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

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

const chartOptions = {
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

const defaultChartConfig = {
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

import { ML_MODELS, TOWNS, STOREY_RANGES, FLAT_MODELS, MLModel, Town, StoreyRange, FlatModel } from '../lib/lists';

const { Option } = Select;
const { Title } = Typography;

export type FieldType = {
	ml_model: MLModel;
	town: Town;
	storey_range: StoreyRange;
	flat_model: FlatModel;
	floor_area_sqm: number;
	lease_commence_date: Dayjs;
};

type ApiResponse = { labels: string; data: number }[];
type ChartConfig = {
	labels: string[];
	datasets: Array<{
		label: string;
		data: number[];
		borderColor: string;
		backgroundColor: string;
	}>;
};

export default function Home() {
	const { t, i18n } = useTranslation();
	const screens = Grid.useBreakpoint();
	const isMobile = !screens.md;
	const [darkMode, setDarkMode] = useState(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('theme') === 'dark';
		}
		return false;
	});
	useEffect(() => {
		if (typeof window !== 'undefined') {
			document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
			localStorage.setItem('theme', darkMode ? 'dark' : 'light');
		}
	}, [darkMode]);
	const curr = useMemo(() => initialFormValues.lease_commence_date, []);
	const labels = useMemo(
		() => [...Array(13).keys()].reverse().map((x) => curr.subtract(x, 'month').format('YYYY-MM')),
		[curr]
	);

	const [output, setOutput] = useState(0.0);
	const [config, setConfig] = useState<ChartConfig>(defaultChartConfig);
	const [loading, setLoading] = useState(false);
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
				const parsed = JSON.parse(savedForm);
				if (parsed.lease_commence_date) {
					parsed.lease_commence_date = dayjs(parsed.lease_commence_date);
				}
				form.setFieldsValue(parsed);
			} catch {}
		}
	}, [form, i18n]);

	// --- Persistence: Save on change ---
	const handleFormChange = useCallback((_: unknown, allValues: Partial<FieldType>) => {
		const persist: Record<string, any> = { ...allValues };
		if (persist.lease_commence_date && typeof persist.lease_commence_date.toISOString === 'function') {
			persist.lease_commence_date = persist.lease_commence_date.toISOString();
		}
		localStorage.setItem('form', JSON.stringify(persist));
	}, []);

	useEffect(() => {
		localStorage.setItem('lang', i18n.language);
	}, [i18n.language]);

	const disabledYear = useCallback((current: Dayjs) => {
		return current.isBefore('1960-01-01') || current.isAfter('2022-01-01', 'year');
	}, []);

	const handleReset = useCallback(() => {
		form.setFieldsValue(initialFormValues);
		setOutput(0.0);
		setConfig(defaultChartConfig);
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
		} catch (err: any) {
			message.error(err?.message || 'Failed to fetch prediction. Please try again.');
		} finally {
			setLoading(false);
		}
	}, [curr, form]);

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

	return (
		<main style={{
			padding: isMobile ? 0 : 24,
			background: darkMode
				? 'linear-gradient(135deg, #232946 0%, #16161a 100%)'
				: 'linear-gradient(135deg, #e0e7ff 0%, #f5f7fa 100%)',
			minHeight: '100vh',
			fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif`,
			transition: 'background 0.5s'
		}}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 8 : 16 }}>
				<Button
					icon={darkMode ? <BulbFilled /> : <BulbOutlined />}
					style={{ borderRadius: 20, background: darkMode ? '#232946' : '#fff', color: darkMode ? '#ffe066' : '#6366f1', boxShadow: '0 1px 4px #dbeafe', fontWeight: 500, marginRight: 8 }}
					onClick={() => setDarkMode((d) => !d)}
					aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
				/>
				<Button size="small" style={{ borderRadius: 20, background: darkMode ? '#232946' : '#fff', color: darkMode ? '#ffe066' : '#6366f1', boxShadow: '0 1px 4px #dbeafe', fontWeight: 500 }} onClick={() => {
					const nextLang = i18n.language === 'en' ? 'zh' : 'en';
					i18n.changeLanguage(nextLang);
					localStorage.setItem('lang', nextLang);
				}}>
					{t('switch_language')}
				</Button>
			</div>
			<Title level={2} style={{ marginBottom: isMobile ? 12 : 24, textAlign: 'center', fontSize: isMobile ? 26 : 36, fontWeight: 800, letterSpacing: 1, color: darkMode ? '#ffe066' : '#1e293b', textShadow: darkMode ? '0 2px 8px #232946' : '0 2px 8px #e0e7ff' }}>{t('price_prediction')}</Title>
			<AnimatePresence>
				<motion.div
					key="form-card"
					initial="hidden"
					animate="visible"
					exit="hidden"
					variants={cardVariants}
					style={{ width: '100%' }}
				>
					<Card
						style={{
							maxWidth: isMobile ? '100vw' : 600,
							width: '100vw',
							margin: isMobile ? 0 : '0 auto 24px auto',
							boxShadow: isMobile ? 'none' : (darkMode ? '0 8px 32px 0 rgba(31,38,135,0.25)' : '0 8px 32px 0 rgba(31, 38, 135, 0.15)'),
							borderRadius: isMobile ? 0 : 24,
							padding: isMobile ? 8 : 32,
							background: darkMode ? 'rgba(36,37,46,0.95)' : 'rgba(255,255,255,0.85)',
							backdropFilter: isMobile ? undefined : 'blur(8px)',
							border: darkMode ? '1px solid #232946' : '1px solid #e0e7ff',
							fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif`,
							transition: 'box-shadow 0.3s, background 0.3s'
						}}
					>
						<Title level={4} style={{ marginBottom: isMobile ? 8 : 16, textAlign: 'center', fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#2563eb' }}>{t('prediction_form')}</Title>
						<Form
							form={form}
							labelCol={{ xs: { span: 24 }, sm: { span: 8 } }}
							wrapperCol={{ xs: { span: 24 }, sm: { span: 16 } }}
							layout={isMobile ? 'vertical' : 'horizontal'}
							initialValues={initialFormValues}
							onFinish={handleFinish}
							onValuesChange={handleFormChange}
						>
							<Space orientation="vertical" size={isMobile ? 8 : 20} style={{ width: '100%' }}>
								<Form.Item<FieldType>
									name="ml_model"
									label={t('ml_model')}
									rules={[{ required: true, message: t('choose_ml_model') }]}
								>
									<Select placeholder={t('select_ml_model')} autoFocus aria-label={t('ml_model')}>
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
									<Select placeholder={t('select_town')} aria-label={t('town')}>
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
									<Select placeholder={t('select_storey_range')} aria-label={t('storey_range')}>
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
									<Select placeholder={t('select_flat_model')} aria-label={t('flat_model')}>
										{FLAT_MODELS.map((flat_model) => (
											<Option key={flat_model} value={flat_model}>
												{t(`flat_models.${flat_model}`, flat_model)}
											</Option>
										))}
									</Select>
								</Form.Item>
								<Form.Item<FieldType>
									name="floor_area_sqm"
									label={t('floor_area')}
									rules={[
										{ required: true, message: t('missing_floor_area') },
										{ type: 'number', min: 20, max: 300, message: t('floor_area_range') }
									]}
								>
									<InputNumber type="number" min={20} max={300} addonAfter="m²" style={{ width: '100%' }} placeholder={t('enter_floor_area')} aria-label={t('floor_area')} />
								</Form.Item>
								<Form.Item<FieldType>
									name="lease_commence_date"
									label={t('lease_commence_date')}
									rules={[{ required: true, message: t('missing_lease_commence_date') }]}
								>
									<DatePicker picker="year" inputReadOnly={true} disabledDate={disabledYear} style={{ width: '100%' }} placeholder={t('select_year')} aria-label={t('lease_commence_date')} />
								</Form.Item>
								<Row gutter={8} justify={isMobile ? 'center' : 'end'}>
									<Col xs={24} sm={12} style={{ display: 'flex', gap: 12 }}>
										<Button
											style={{ marginTop: 8, flex: 1, minHeight: 48, fontSize: 18, borderRadius: 12, background: 'linear-gradient(90deg, #6366f1 0%, #60a5fa 100%)', color: '#fff', fontWeight: 700, boxShadow: '0 2px 8px #dbeafe', border: 'none', transition: 'background 0.2s' }}
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
											style={{ marginTop: 8, flex: 1, minHeight: 48, fontSize: 18, borderRadius: 12, background: '#fff', color: '#6366f1', fontWeight: 700, border: '1.5px solid #6366f1', boxShadow: '0 2px 8px #e0e7ff', transition: 'background 0.2s' }}
											onClick={handleReset}
											disabled={loading}
											aria-label={t('reset_form')}
											block
										>
											{t('reset_form')}
										</Button>
									</Col>
								</Row>
							</Space>
						</Form>
					</Card>
				</motion.div>
			</AnimatePresence>
			<AnimatePresence mode="wait">
				<motion.div
					key="chart-card"
					initial="hidden"
					animate="visible"
					exit="hidden"
					variants={cardVariants}
					style={{ width: '100%' }}
				>
					<Card
						style={{
							maxWidth: isMobile ? '100vw' : 900,
							width: '100vw',
							margin: isMobile ? 0 : '0 auto',
							boxShadow: isMobile ? 'none' : (darkMode ? '0 8px 32px 0 rgba(31,38,135,0.18)' : '0 8px 32px 0 rgba(31, 38, 135, 0.10)'),
							borderRadius: isMobile ? 0 : 24,
							padding: isMobile ? 8 : 32,
							background: darkMode ? 'rgba(36,37,46,0.95)' : 'rgba(255,255,255,0.85)',
							backdropFilter: isMobile ? undefined : 'blur(8px)',
							border: darkMode ? '1px solid #232946' : '1px solid #e0e7ff',
							fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif`,
							transition: 'box-shadow 0.3s, background 0.3s'
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: isMobile ? 8 : 16 }}>
							<span role="img" aria-label="chart" style={{ fontSize: isMobile ? 22 : 28, color: '#6366f1', filter: 'drop-shadow(0 2px 8px #e0e7ff)' }}>📈</span>
							<Title level={4} style={{ margin: 0, textAlign: 'center', fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#2563eb' }}></Title>
						</div>
						<Divider style={{ margin: isMobile ? '8px 0' : '16px 0', borderColor: darkMode ? '#232946' : '#e0e7ff' }} />
						<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: isMobile ? 220 : 320, width: '100%' }}>
							<AnimatePresence mode="wait">
								<motion.div
									key={JSON.stringify(config.labels)}
									initial="hidden"
									animate="visible"
									exit="hidden"
									variants={chartVariants}
									style={{ minHeight: 220, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
								>
									<Line ref={chartRef} options={chartOptions} data={config} style={{ maxHeight: isMobile ? 220 : 320, width: '100%' }} />
								</motion.div>
							</AnimatePresence>
						</div>
						<Divider style={{ margin: isMobile ? '8px 0' : '16px 0', borderColor: darkMode ? '#232946' : '#e0e7ff' }} />
						<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
							<motion.div
								key={output}
								initial="initial"
								animate="animate"
								variants={valueVariants}
								style={{ fontWeight: 800, fontSize: isMobile ? 28 : 40, minWidth: 120, textAlign: 'center', marginBottom: isMobile ? 8 : 0 }}
							>
								<Statistic
									value={output}
									precision={0}
									prefix="$"
									valueStyle={{ color: darkMode ? '#ffe066' : '#2563eb', fontWeight: 800, fontSize: isMobile ? 28 : 40 }}
									title={t('predicted_price')}
								/>
							</motion.div>
						</div>
					</Card>
				</motion.div>
			</AnimatePresence>
		</main>
	);
}
