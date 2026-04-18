'use client';

import {
	startTransition,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { App as AntdApp, Button, Form, Grid } from 'antd';
import { BulbFilled, BulbOutlined } from '@ant-design/icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import dayjs from '../../lib/dayjs';
import en from '../../app/locales/en.json';
import styles from './styles.module.css';
import '../../app/i18n';
import {
	MAX_LEASE_COMMENCE_YEAR,
	MIN_LEASE_COMMENCE_YEAR,
	STORAGE_KEYS,
	type PredictionRequestBody,
	serializeLeaseCommenceDate
} from '../../lib/prediction';
import { FLAT_MODELS, ML_MODELS, TOWNS } from '../../lib/lists';
import PredictionForm from './PredictionForm';
import PredictionResults from './PredictionResults';
import { defaultTrendData, initialFormValues } from './constants';
import { getPredictionTheme, getThemeVars } from './theme';
import type {
	ApiResponse,
	FieldType,
	PersistedFieldValues,
	SummaryValues
} from './types';
import {
	getErrorMessage,
	getResponseErrorMessage,
	isAbortError,
	normalizePrice,
	normalizeTrendData
} from './utils';

export default function PredictionPage() {
	const { message: messageApi } = AntdApp.useApp();
	const { t, i18n } = useTranslation();
	const screens = Grid.useBreakpoint();
	const [mounted, setMounted] = useState(false);
	const [darkMode, setDarkMode] = useState(false);
	const [output, setOutput] = useState(0);
	const [trendData, setTrendData] = useState(defaultTrendData);
	const [loading, setLoading] = useState(false);
	const [summaryValues, setSummaryValues] = useState<SummaryValues>({
		ml_model: initialFormValues.ml_model,
		town: initialFormValues.town,
		lease_commence_date: initialFormValues.lease_commence_date
	});
	const [form] = Form.useForm<FieldType>();
	const hasRestoredRef = useRef(false);
	const requestControllerRef = useRef<AbortController | null>(null);

	const isMobile = mounted ? !screens.md : false;
	const theme = useMemo(() => getPredictionTheme(darkMode), [darkMode]);
	const cssVars = useMemo(() => getThemeVars(theme), [theme]);
	const headlineClassName =
		i18n.language === 'zh'
			? `${styles.headline} ${styles.headlineCjk}`
			: styles.headline;

	useEffect(() => {
		setMounted(true);
		if (localStorage.getItem(STORAGE_KEYS.theme) === 'dark') {
			setDarkMode(true);
		}
	}, []);

	useEffect(() => {
		if (!mounted) {
			return;
		}

		document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
		localStorage.setItem(STORAGE_KEYS.theme, darkMode ? 'dark' : 'light');
	}, [darkMode, mounted]);

	useEffect(() => {
		if (hasRestoredRef.current) {
			return;
		}

		hasRestoredRef.current = true;
		const savedLang = localStorage.getItem(STORAGE_KEYS.language);
		if (savedLang && savedLang !== i18n.language) {
			i18n.changeLanguage(savedLang);
		}

		const savedForm = localStorage.getItem(STORAGE_KEYS.form);
		if (!savedForm) {
			return;
		}

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
				lease_commence_date:
					restoredValues.lease_commence_date ?? initialFormValues.lease_commence_date
			});
		} catch {
			localStorage.removeItem(STORAGE_KEYS.form);
		}
	}, [form, i18n]);

	useEffect(() => {
		if (!mounted) {
			return;
		}

		document.documentElement.lang = i18n.language;
		document.documentElement.setAttribute('data-lang', i18n.language);
		localStorage.setItem(STORAGE_KEYS.language, i18n.language);
	}, [i18n.language, mounted]);

	useEffect(() => {
		return () => {
			requestControllerRef.current?.abort();
		};
	}, []);

	const disabledYear = useCallback((current: FieldType['lease_commence_date']) => {
		return (
			current.isBefore(`${MIN_LEASE_COMMENCE_YEAR}-01-01`) ||
			current.isAfter(`${MAX_LEASE_COMMENCE_YEAR}-01-01`, 'year')
		);
	}, []);

	const handleFormChange = useCallback((_: unknown, allValues: Partial<FieldType>) => {
		const persist: PersistedFieldValues = {
			...allValues,
			lease_commence_date: allValues.lease_commence_date
				? serializeLeaseCommenceDate(allValues.lease_commence_date)
				: undefined
		};

		localStorage.setItem(STORAGE_KEYS.form, JSON.stringify(persist));
		setSummaryValues({
			ml_model: allValues.ml_model ?? initialFormValues.ml_model,
			town: allValues.town ?? initialFormValues.town,
			lease_commence_date:
				allValues.lease_commence_date ?? initialFormValues.lease_commence_date
		});
	}, []);

	const handleReset = useCallback(() => {
		requestControllerRef.current?.abort();
		requestControllerRef.current = null;
		setLoading(false);
		form.setFieldsValue(initialFormValues);
		setOutput(0);
		setTrendData(defaultTrendData);
		setSummaryValues({
			ml_model: initialFormValues.ml_model,
			town: initialFormValues.town,
			lease_commence_date: initialFormValues.lease_commence_date
		});

		localStorage.removeItem(STORAGE_KEYS.form);
	}, [form]);

	const handleFinish = useCallback(
		async (values: FieldType) => {
			requestControllerRef.current?.abort();
			const controller = new AbortController();
			requestControllerRef.current = controller;
			setLoading(true);
			const requestBody: PredictionRequestBody = {
				mlModel: values.ml_model,
				town: values.town,
				storeyRange: values.storey_range,
				flatModel: values.flat_model,
				floorAreaSqm: values.floor_area_sqm,
				leaseCommenceDate: serializeLeaseCommenceDate(values.lease_commence_date)
			};

			try {
				const response = await fetch('/api/prices', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(requestBody),
					signal: controller.signal
				});

				if (!response.ok) {
					throw new Error(await getResponseErrorMessage(response, t('error_fetch')));
				}

				const serverData: ApiResponse = await response.json();
				const normalizedData = normalizeTrendData(serverData);
				setTrendData(normalizedData);
				setOutput(normalizePrice(normalizedData[normalizedData.length - 1]?.value ?? 0));
			} catch (error: unknown) {
				if (isAbortError(error)) {
					return;
				}

				messageApi.error(getErrorMessage(error, t('error_fetch')));
			} finally {
				if (requestControllerRef.current === controller) {
					requestControllerRef.current = null;
					setLoading(false);
				}
			}
		},
		[messageApi, t]
	);

	const motionVariants = {
		hidden: { opacity: 0, y: 40 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
	};

	const valueVariants = {
		initial: { scale: 1, color: darkMode ? '#cf8b60' : '#af6542' },
		animate: {
			scale: [1, 1.18, 1],
			color: darkMode ? '#cf8b60' : '#af6542',
			transition: { duration: 0.6 }
		}
	};

	const initialShellTheme = getPredictionTheme(false);

	if (!mounted) {
		return (
			<main
				className={styles.shell}
				style={{
					background: initialShellTheme.background,
					padding: '26px 28px 42px',
					...getThemeVars(initialShellTheme)
				}}
			>
				<div className={styles.surface}>
					<div className={styles.topbar}>
						<div className={styles.pill}>{en.intro_eyebrow}</div>
					</div>

					<div className={styles.layout}>
						<section className={styles.panel}>
							<div className={styles.card}>
								<div className={styles.cardInner}>
									<div className={styles.introBlock}>
										<h1 className={styles.headline}>{en.price_prediction}</h1>
										<p className={styles.lead}>{en.intro_blurb}</p>
									</div>
								</div>
							</div>
						</section>

						<section className={styles.resultsPanel}>
							<div className={styles.resultsCard}>
								<div className={styles.chartFrame} />
							</div>
						</section>
					</div>
				</div>
			</main>
		);
	}

	return (
		<main
			className={styles.shell}
			style={{
				background: theme.background,
				padding: isMobile ? '18px 14px 30px' : '26px 28px 42px',
				...cssVars
			}}
		>
			<div className={styles.surface}>
				<div className={styles.topbar}>
					<div className={styles.pill}>{t('intro_eyebrow')}</div>

					<div className={styles.actions}>
						<Button
							className={styles.ghostButton}
							icon={darkMode ? <BulbFilled /> : <BulbOutlined />}
							onClick={() => setDarkMode((value) => !value)}
							aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
						/>
						<Button
							className={styles.ghostButton}
							size="small"
							onClick={() => {
								const nextLang = i18n.language === 'en' ? 'zh' : 'en';
								startTransition(() => {
									i18n.changeLanguage(nextLang);
								});
							}}
						>
							{t('switch_language')}
						</Button>
					</div>
				</div>

				<div className={styles.layout}>
					<AnimatePresence>
						<motion.section
							key="form-card"
							initial="hidden"
							animate="visible"
							exit="hidden"
							variants={motionVariants}
							className={styles.panel}
						>
							<div className={styles.card}>
								<div className={styles.cardInner}>
									<div className={styles.introBlock}>
										<h1 className={headlineClassName}>{t('price_prediction')}</h1>
										<p className={styles.lead}>{t('intro_blurb')}</p>

										<div className={styles.figureRow}>
											{[
												{
													label: t('ml_model'),
													value: ML_MODELS.length.toString().padStart(2, '0')
												},
												{
													label: t('town'),
													value: TOWNS.length.toString().padStart(2, '0')
												},
												{
													label: t('flat_model'),
													value: FLAT_MODELS.length.toString().padStart(2, '0')
												}
											].map((item) => (
												<div key={item.label} className={styles.figure}>
													<span className={styles.figureLabel}>{item.label}</span>
													<strong className={styles.figureValue}>{item.value}</strong>
												</div>
											))}
										</div>

										<p className={styles.caption}>{t('intro_caption')}</p>
									</div>

									<PredictionForm
										form={form}
										loading={loading}
										onFinish={handleFinish}
										onReset={handleReset}
										onValuesChange={handleFormChange}
										disabledYear={disabledYear}
										t={t}
									/>
								</div>
							</div>
						</motion.section>
					</AnimatePresence>

					<AnimatePresence mode="wait">
						<motion.section
							key="results-card"
							initial="hidden"
							animate="visible"
							exit="hidden"
							variants={motionVariants}
							className={styles.resultsPanel}
						>
							<PredictionResults
								isMobile={isMobile}
								output={output}
								summaryValues={summaryValues}
								t={t}
								theme={theme}
								trendData={trendData}
								valueVariants={valueVariants}
							/>
						</motion.section>
					</AnimatePresence>
				</div>
			</div>
		</main>
	);
}
