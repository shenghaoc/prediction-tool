'use client';

import {
	startTransition,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode
} from 'react';
import {
	App as AntdApp,
	Button,
	Card,
	ConfigProvider,
	Flex,
	Form,
	Grid,
	Segmented,
	Tag,
	theme as antTheme
} from 'antd';
import { BulbFilled, BulbOutlined } from '@ant-design/icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import dayjs from '../../lib/dayjs';
import { getAntdLocale } from '../../lib/antdLocale';
import styles from './styles.module.css';
import '../../app/i18n';
import {
	MAX_LEASE_COMMENCE_YEAR,
	MIN_LEASE_COMMENCE_YEAR,
	STORAGE_KEYS,
	type PredictionRequestBody,
	serializeLeaseCommenceDate
} from '../../lib/prediction';
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

type PredictionClientProps = {
	introContent: ReactNode;
	pillContent: ReactNode;
};

export default function PredictionClient({
	introContent,
	pillContent
}: PredictionClientProps) {
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
	const antdLocale = getAntdLocale(i18n.language);
	const predictionAntTheme = useMemo(
		() => ({
			algorithm: darkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
			token: {
				colorBgBase: theme.pageBg,
				colorBgContainer: theme.panelStrong,
				colorBgElevated: theme.panelStrong,
				colorBorder: theme.lineSoft,
				colorBorderSecondary: theme.lineSoft,
				colorFillSecondary: theme.fieldBg,
				colorPrimary: theme.primary,
				colorText: theme.text,
				colorTextSecondary: theme.textMuted,
				boxShadowSecondary: `0 24px 70px ${theme.shadow}`,
				borderRadius: 18,
				borderRadiusLG: 24,
				fontFamily:
					'var(--font-body), "PingFang SC", "Noto Sans SC", sans-serif'
			},
			components: {
				Button: {
					borderRadius: 999,
					fontWeight: 700
				},
				Card: {
					bodyPadding: 24
				},
				DatePicker: {
					controlHeightLG: 52
				},
				InputNumber: {
					controlHeightLG: 52
				},
				Select: {
					controlHeightLG: 52
				}
			}
		}),
		[darkMode, theme]
	);

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
			<ConfigProvider
				componentSize="large"
				locale={getAntdLocale('en')}
				theme={predictionAntTheme}
				variant="filled"
			>
				<main
					className={styles.shell}
					style={{
						background: initialShellTheme.background,
						padding: '26px 28px 42px',
						...getThemeVars(initialShellTheme)
					}}
				>
					<div className={styles.surface}>
						<Flex
							className={styles.topbar}
							justify="space-between"
							align="center"
							gap="middle"
							wrap
						>
							<Tag className={styles.pill} variant="filled">
								{pillContent}
							</Tag>
						</Flex>

						<div className={styles.layout}>
							<section className={styles.panel}>
								<Card className={styles.card} variant="borderless">
									<div className={styles.cardInner}>{introContent}</div>
								</Card>
							</section>

							<section className={styles.resultsPanel}>
								<Card className={styles.resultsCard} variant="borderless">
									<div className={styles.chartFrame} />
								</Card>
							</section>
						</div>
					</div>
				</main>
			</ConfigProvider>
		);
	}

	return (
		<ConfigProvider
			componentSize="large"
			locale={antdLocale}
			theme={predictionAntTheme}
			variant="filled"
		>
			<main
				className={styles.shell}
				style={{
					background: theme.background,
					padding: isMobile ? '18px 14px 30px' : '26px 28px 42px',
					...cssVars
				}}
			>
				<div className={styles.surface}>
					<Flex
						className={styles.topbar}
						justify="space-between"
						align="center"
						gap="middle"
						wrap
					>
						<Tag className={styles.pill} variant="filled">
							{pillContent}
						</Tag>

						<Flex className={styles.actions} gap="small" wrap>
							<Button
								className={styles.ghostButton}
								icon={darkMode ? <BulbFilled /> : <BulbOutlined />}
								onClick={() => setDarkMode((value) => !value)}
								aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
							/>
							<Segmented
								className={styles.languageSwitch}
								options={[
									{ label: 'EN', value: 'en' },
									{ label: '中文', value: 'zh' }
								]}
								shape="round"
								size="large"
								value={i18n.language}
								onChange={(value) => {
									startTransition(() => {
										i18n.changeLanguage(String(value));
									});
								}}
							/>
						</Flex>
					</Flex>

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
								<Card className={styles.card} variant="borderless">
									<div className={styles.cardInner}>
										{introContent}

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
								</Card>
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
		</ConfigProvider>
	);
}
