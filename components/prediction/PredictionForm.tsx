'use client';

import { Button, DatePicker, Form, InputNumber, Select } from 'antd';
import type { FormInstance } from 'antd';
import type { TFunction } from 'i18next';

import {
	MAX_FLOOR_AREA_SQM,
	MIN_FLOOR_AREA_SQM,
} from '../../lib/prediction';
import { FLAT_MODELS, ML_MODELS, STOREY_RANGES, TOWNS } from '../../lib/lists';
import { initialFormValues } from './constants';
import styles from './styles.module.css';
import type { FieldType } from './types';

type PredictionFormProps = {
	form: FormInstance<FieldType>;
	loading: boolean;
	onFinish: (values: FieldType) => Promise<void>;
	onReset: () => void;
	onValuesChange: (_: unknown, allValues: Partial<FieldType>) => void;
	disabledYear: (current: FieldType['lease_commence_date']) => boolean;
	t: TFunction;
};

const { Option } = Select;

export default function PredictionForm({
	form,
	loading,
	onFinish,
	onReset,
	onValuesChange,
	disabledYear,
	t
}: PredictionFormProps) {
	return (
		<div className={styles.formShell}>
			<h2 className={styles.sectionTitle}>{t('prediction_form')}</h2>
			<Form
				form={form}
				layout="vertical"
				initialValues={initialFormValues}
				onFinish={onFinish}
				onValuesChange={onValuesChange}
			>
				<div className={styles.formGrid}>
					<Form.Item<FieldType>
						name="ml_model"
						label={t('ml_model')}
						rules={[{ required: true, message: t('choose_ml_model') }]}
					>
						<Select
							placeholder={t('select_ml_model')}
							autoFocus
							aria-label={t('ml_model')}
							size="large"
						>
							{ML_MODELS.map((mlModel) => (
								<Option key={mlModel} value={mlModel}>
									{t(`ml_models.${mlModel}`, mlModel)}
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
						<Select
							placeholder={t('select_storey_range')}
							aria-label={t('storey_range')}
							size="large"
						>
							{STOREY_RANGES.map((storeyRange) => (
								<Option key={storeyRange} value={storeyRange}>
									{t(`storey_ranges.${storeyRange}`, storeyRange)}
								</Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item<FieldType>
						name="flat_model"
						label={t('flat_model')}
						rules={[{ required: true, message: t('missing_flat_model') }]}
					>
						<Select
							placeholder={t('select_flat_model')}
							aria-label={t('flat_model')}
							size="large"
						>
							{FLAT_MODELS.map((flatModel) => (
								<Option key={flatModel} value={flatModel}>
									{t(`flat_models.${flatModel}`, flatModel)}
								</Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item<FieldType>
						className={styles.fieldFull}
						label={t('floor_area')}
					>
						<div className={styles.unitWrap}>
							<Form.Item<FieldType>
								name="floor_area_sqm"
								noStyle
								rules={[
									{ required: true, message: t('missing_floor_area') },
									{
										type: 'number',
										min: MIN_FLOOR_AREA_SQM,
										max: MAX_FLOOR_AREA_SQM,
										message: t('floor_area_range')
									}
								]}
							>
								<InputNumber
									min={MIN_FLOOR_AREA_SQM}
									max={MAX_FLOOR_AREA_SQM}
									precision={0}
									step={1}
									changeOnWheel={false}
									controls={false}
									parser={(value) => Number((value ?? '').replace(/[^\d]/g, ''))}
									style={{ width: '100%' }}
									placeholder={t('enter_floor_area')}
									aria-label={t('floor_area')}
									size="large"
								/>
							</Form.Item>
							<div className={styles.unitTag}>m²</div>
						</div>
					</Form.Item>

					<Form.Item<FieldType>
						className={styles.fieldFull}
						name="lease_commence_date"
						label={t('lease_commence_date')}
						rules={[{ required: true, message: t('missing_lease_commence_date') }]}
					>
						<DatePicker
							picker="year"
							inputReadOnly
							disabledDate={disabledYear}
							style={{ width: '100%' }}
							placeholder={t('select_year')}
							aria-label={t('lease_commence_date')}
							size="large"
						/>
					</Form.Item>

					<div className={`${styles.buttonRow} ${styles.fieldFull}`}>
						<Button
							className={styles.primaryButton}
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
							className={styles.resetButton}
							onClick={onReset}
							disabled={loading}
							aria-label={t('reset_form')}
						>
							{t('reset_form')}
						</Button>
					</div>
				</div>
			</Form>
		</div>
	);
}
