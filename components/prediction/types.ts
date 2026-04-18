import type { Dayjs } from '../../lib/dayjs';
import type { PredictionApiResponse } from '../../lib/prediction';

import type { MLModel, Town, StoreyRange, FlatModel } from '../../lib/lists';

export type FieldType = {
	ml_model: MLModel;
	town: Town;
	storey_range: StoreyRange;
	flat_model: FlatModel;
	floor_area_sqm: number;
	lease_commence_date: Dayjs;
};

export type SummaryValues = Pick<FieldType, 'ml_model' | 'town' | 'lease_commence_date'>;

export type PersistedFieldValues = Omit<Partial<FieldType>, 'lease_commence_date'> & {
	lease_commence_date?: string;
};

export type ApiResponse = PredictionApiResponse;

export type TrendPoint = {
	label: string;
	value: number;
};
