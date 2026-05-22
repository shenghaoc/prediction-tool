'use client';

import {
	startTransition,
	useCallback,
	useEffect,
	useRef,
	useState
} from 'react';
import { useTranslation } from 'react-i18next';

import dayjs from '../../lib/dayjs';
import '../../app/i18n';
import {
	STORAGE_KEYS,
	type PredictionRequestBody,
	serializeLeaseCommenceDate
} from '../../lib/prediction';
import PredictionForm from './PredictionForm';
import PredictionResults from './PredictionResults';
import { defaultTrendData, initialFormValues } from './constants';
import { FLAT_MODELS, ML_MODELS, TOWNS } from '../../lib/lists';
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

export default function PredictionClient() {
	const { t, i18n } = useTranslation();
	const [mounted, setMounted] = useState(false);
	const [darkMode, setDarkMode] = useState(false);
	const [output, setOutput] = useState(0);
	const [trendData, setTrendData] = useState(defaultTrendData);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formValues, setFormValues] = useState<FieldType>(initialFormValues);
	const [summaryValues, setSummaryValues] = useState<SummaryValues>({
		ml_model: initialFormValues.ml_model,
		town: initialFormValues.town,
		lease_commence_date: initialFormValues.lease_commence_date
	});
	const hasRestoredRef = useRef(false);
	const requestControllerRef = useRef<AbortController | null>(null);

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

		document.documentElement.classList.toggle('dark', darkMode);
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

			setFormValues(prev => ({ ...prev, ...restoredValues }));
			setSummaryValues({
				ml_model: restoredValues.ml_model ?? initialFormValues.ml_model,
				town: restoredValues.town ?? initialFormValues.town,
				lease_commence_date:
					restoredValues.lease_commence_date ?? initialFormValues.lease_commence_date
			});
		} catch {
			localStorage.removeItem(STORAGE_KEYS.form);
		}
	}, [i18n]);

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

	const handleFormChange = useCallback((_: unknown, allValues: Partial<FieldType>) => {
		setError(null);
		setFormValues(prev => ({ ...prev, ...allValues }));
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
		setError(null);
		setFormValues(initialFormValues);
		setOutput(0);
		setTrendData(defaultTrendData);
		setSummaryValues({
			ml_model: initialFormValues.ml_model,
			town: initialFormValues.town,
			lease_commence_date: initialFormValues.lease_commence_date
		});

		localStorage.removeItem(STORAGE_KEYS.form);
	}, []);

	const handleFinish = useCallback(
		async (values: FieldType) => {
			requestControllerRef.current?.abort();
			const controller = new AbortController();
			requestControllerRef.current = controller;
			setLoading(true);
			setError(null);
			const requestBody: PredictionRequestBody = {
				mlModel: values.ml_model,
				town: values.town,
				storeyRange: values.storey_range,
				flatModel: values.flat_model,
				floorAreaSqm: values.floor_area_sqm,
				leaseCommenceYear: values.lease_commence_date.year()
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
			} catch (err: unknown) {
				if (isAbortError(err)) {
					return;
				}

				setError(getErrorMessage(err, t('error_fetch')));
			} finally {
				if (requestControllerRef.current === controller) {
					requestControllerRef.current = null;
					setLoading(false);
				}
			}
		},
		[t]
	);

	const figures = [
		{ label: t('stat_models'), value: ML_MODELS.length.toString().padStart(2, '0') },
		{ label: t('stat_towns'), value: TOWNS.length.toString().padStart(2, '0') },
		{ label: t('stat_types'), value: FLAT_MODELS.length.toString().padStart(2, '0') }
	];

	if (!mounted) {
		return null;
	}

	return (
		<main className="shell">
			<div className="surface">
				<header className="topbar">
					<div className="brand-badge">
						<span className="brand-text">{t('brand')}</span>
						<span className="badge">{t('badge')}</span>
					</div>

					<div className="actions">
						<button
							className="btn-ghost"
							onClick={() => {
								startTransition(() => {
									i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en');
								});
							}}
						>
							{t('switch_language')}
						</button>
						<button
							className="btn-ghost btn-icon"
							onClick={() => setDarkMode((value) => !value)}
							aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
						>
							{darkMode ? '☀' : '◑'}
						</button>
					</div>
				</header>

				<div className="layout">
					<div className="left-col">
						<div className="card">
							<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
								<h1 className={`headline${i18n.language === 'zh' ? ' headline-cjk' : ''}`}>
									{t('price_prediction')}
								</h1>
								<p className="lead">{t('intro_blurb')}</p>
								<div className="stat-row">
									{figures.map(f => (
										<div key={f.label} className="stat-card">
											<span className="stat-label">{f.label}</span>
											<strong className="stat-value">{f.value}</strong>
										</div>
									))}
								</div>
							</div>
						</div>

						<div className="card">
							{error && (
								<div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>
							)}

							<PredictionForm
								formValues={formValues}
								loading={loading}
								onFinish={handleFinish}
								onReset={handleReset}
								onValuesChange={handleFormChange}
								t={t}
							/>
						</div>
					</div>

					<section>
						<PredictionResults
							output={output}
							summaryValues={summaryValues}
							t={t}
							trendData={trendData}
							locale={i18n.language}
						/>
					</section>
				</div>
			</div>
		</main>
	);
}
