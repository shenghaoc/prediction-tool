import dayjs from '../../lib/dayjs';
import { FLAT_MODELS, ML_MODELS, STOREY_RANGES, TOWNS } from '../../lib/lists';
import { DEFAULT_LEASE_COMMENCE_DATE } from '../../lib/prediction';
import type { FieldType, TrendPoint } from './types';

export const initialFormValues: FieldType = {
	ml_model: ML_MODELS[0],
	town: TOWNS[0],
	storey_range: STOREY_RANGES[0],
	flat_model: FLAT_MODELS[0],
	floor_area_sqm: 20,
	lease_commence_date: dayjs.utc(DEFAULT_LEASE_COMMENCE_DATE, 'YYYY-MM-DD')
};

export const defaultTrendData: TrendPoint[] = [...Array(13).keys()]
	.reverse()
	.map((monthOffset) => ({
		label: initialFormValues.lease_commence_date.subtract(monthOffset, 'month').format('YYYY-MM'),
		value: 0
	}));
