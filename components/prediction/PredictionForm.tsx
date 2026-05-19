'use client';

import type { TFunction } from 'i18next';
import dayjs from '../../lib/dayjs';
import { MAX_FLOOR_AREA_SQM, MIN_FLOOR_AREA_SQM } from '../../lib/prediction';
import { FLAT_MODELS, ML_MODELS, STOREY_RANGES, TOWNS, LEASE_COMMENCE_YEARS } from '../../lib/lists';
import type { FieldType } from './types';

type PredictionFormProps = {
	loading: boolean;
	onFinish: (values: FieldType) => Promise<void>;
	onReset: () => void;
	onValuesChange: (_: unknown, allValues: Partial<FieldType>) => void;
	t: TFunction;
	formValues: FieldType;
};

function Field({ label, children, full, htmlFor }: { label: string; children: React.ReactNode; full?: boolean; htmlFor?: string }) {
	return (
		<div className={full ? 'field-full' : undefined}>
			<label className="field-label" htmlFor={htmlFor}>{label}</label>
			{children}
		</div>
	);
}

export default function PredictionForm({
	loading,
	onFinish,
	onReset,
	onValuesChange,
	t,
	formValues,
}: PredictionFormProps) {
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onFinish(formValues);
	};

	const handleChange = (key: keyof FieldType, value: unknown) => {
		const newValues = { ...formValues, [key]: value };
		onValuesChange(null, newValues);
	};

	return (
		<div className="form-shell">
			<h2 className="section-title">{t('prediction_form')}</h2>
			<form onSubmit={handleSubmit}>
				<div className="form-grid">
					<Field label={t('ml_model')} htmlFor="input-ml_model">
						<select
							id="input-ml_model"
							className="field-select"
							value={formValues.ml_model || ''}
							onChange={(e) => handleChange('ml_model', e.target.value)}
							required
						>
							<option value="" disabled>{t('select_ml_model')}</option>
							{ML_MODELS.map((m) => (
								<option key={m} value={m}>{t(`ml_models.${m}`, m)}</option>
							))}
						</select>
					</Field>
					<Field label={t('town')} htmlFor="input-town">
						<select
							id="input-town"
							className="field-select"
							value={formValues.town || ''}
							onChange={(e) => handleChange('town', e.target.value)}
							required
						>
							<option value="" disabled>{t('select_town')}</option>
							{TOWNS.map((m) => (
								<option key={m} value={m}>{t(`towns.${m}`, m)}</option>
							))}
						</select>
					</Field>
					<Field label={t('storey_range')} htmlFor="input-storey_range">
						<select
							id="input-storey_range"
							className="field-select"
							value={formValues.storey_range || ''}
							onChange={(e) => handleChange('storey_range', e.target.value)}
							required
						>
							<option value="" disabled>{t('select_storey_range')}</option>
							{STOREY_RANGES.map((m) => (
								<option key={m} value={m}>{t(`storey_ranges.${m}`, m)}</option>
							))}
						</select>
					</Field>
					<Field label={t('flat_model')} htmlFor="input-flat_model">
						<select
							id="input-flat_model"
							className="field-select"
							value={formValues.flat_model || ''}
							onChange={(e) => handleChange('flat_model', e.target.value)}
							required
						>
							<option value="" disabled>{t('select_flat_model')}</option>
							{FLAT_MODELS.map((m) => (
								<option key={m} value={m}>{t(`flat_models.${m}`, m)}</option>
							))}
						</select>
					</Field>
					<Field label={t('floor_area')} full htmlFor="input-floor_area">
						<div className="unit-wrap">
							<input
								id="input-floor_area"
								type="number"
								className="field-input"
								min={MIN_FLOOR_AREA_SQM}
								max={MAX_FLOOR_AREA_SQM}
								value={formValues.floor_area_sqm || ''}
								placeholder={t('enter_floor_area')}
								onChange={(e) => handleChange('floor_area_sqm', e.target.value ? Number(e.target.value) : undefined)}
								required
							/>
							<span className="unit-tag">m²</span>
						</div>
					</Field>
					<Field label={t('lease_commence_date')} full htmlFor="input-lease_commence_date">
						<select
							id="input-lease_commence_date"
							className="field-select"
							value={formValues.lease_commence_date ? formValues.lease_commence_date.year() : ''}
							onChange={(e) => {
								handleChange('lease_commence_date', dayjs(`${e.target.value}-01-01`));
							}}
							required
						>
							<option value="" disabled>{t('select_year')}</option>
							{LEASE_COMMENCE_YEARS.map((y) => (
								<option key={y} value={y}>{y}</option>
							))}
						</select>
					</Field>
					<div className="button-row">
						<button type="submit" className={`btn-primary${loading ? ' loading-pulse' : ''}`} disabled={loading}>
							{loading ? t('predicting') : t('get_prediction')}
						</button>
						<button type="button" className="btn-reset" onClick={onReset}>
							{t('reset_form')}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
