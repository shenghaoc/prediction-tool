import type { PredictionApiResponse } from '../../lib/prediction';
import type { PredictionFormValues } from '../../lib/prediction-schema';

export type FieldType = PredictionFormValues;

export type SummaryValues = Pick<FieldType, 'ml_model' | 'town' | 'lease_commence_year'>;

export type PersistedFieldValues = Partial<FieldType>;

// Bump when the persisted shape changes; older payloads are discarded on read.
export const FORM_SCHEMA_VERSION = 2;

export type PersistedForm = {
	v: number;
	data: PersistedFieldValues;
};

export type ApiResponse = PredictionApiResponse;

export type TrendPoint = {
	label: string;
	value: number;
};
