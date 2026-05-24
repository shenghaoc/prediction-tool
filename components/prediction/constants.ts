import { Temporal } from '../../lib/temporal';
import { FLAT_MODELS, ML_MODELS, STOREY_RANGES, TOWNS } from '../../lib/lists';
import {
	DEFAULT_LEASE_COMMENCE_DATE,
	DEFAULT_PREDICTION_MONTH_END
} from '../../lib/prediction';
import type { FieldType, TrendPoint } from './types';

export const initialFormValues: FieldType = {
	ml_model: ML_MODELS[0],
	town: TOWNS[0],
	storey_range: STOREY_RANGES[0],
	flat_model: FLAT_MODELS[0],
	floor_area_sqm: 20,
	lease_commence_date: Temporal.PlainDate.from(DEFAULT_LEASE_COMMENCE_DATE)
};

export const defaultTrendData: TrendPoint[] = [...Array(13).keys()]
	.reverse()
	.map((monthOffset) => ({
		label: Temporal.PlainYearMonth.from(DEFAULT_PREDICTION_MONTH_END)
			.subtract({ months: monthOffset })
			.toString(),
		value: 0
	}));
