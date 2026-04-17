import dayjs from '../../lib/dayjs';
import {
	FLAT_MODELS,
	ML_MODELS,
	STOREY_RANGES,
	TOWNS
} from '../../lib/lists';
import type { FieldType, TrendPoint } from './types';

export const initialFormValues: FieldType = {
	ml_model: ML_MODELS[0],
	town: TOWNS[0],
	storey_range: STOREY_RANGES[0],
	flat_model: FLAT_MODELS[0],
	floor_area_sqm: 20,
	lease_commence_date: dayjs.utc('2022-02', 'YYYY-MM')
};

export const defaultTrendData: TrendPoint[] = [...Array(13).keys()]
	.reverse()
	.map((monthOffset) => ({
		label: initialFormValues.lease_commence_date.subtract(monthOffset, 'month').format('YYYY-MM'),
		value: 0
	}));
