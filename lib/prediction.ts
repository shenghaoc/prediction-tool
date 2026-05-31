import { Temporal } from './temporal';
import {
	type FlatModel,
	type MLModel,
	type StoreyRange,
	type Town
} from './lists';
import {
	formValuesToNormalized,
	parseApiRequestInput,
	zodErrorToApiMessage
} from './prediction-schema';

export const STORAGE_KEYS = {
	theme: 'prediction-tool:theme',
	form: 'prediction-tool:form'
} as const;

export const DEFAULT_PREDICTION_MONTH_END = '2022-02';
export const DEFAULT_PREDICTION_MONTH_START = Temporal.PlainYearMonth.from(DEFAULT_PREDICTION_MONTH_END)
	.subtract({ months: 12 })
	.toString();
export const DEFAULT_LEASE_COMMENCE_DATE = '2022-01-01';
export const MIN_FLOOR_AREA_SQM = 20;
export const MAX_FLOOR_AREA_SQM = 300;
export const MIN_LEASE_COMMENCE_YEAR = 1960;
export const MAX_LEASE_COMMENCE_YEAR = 2022;

export type PredictionRequestBody = {
	mlModel: string;
	town: string;
	storeyRange: string;
	flatModel: string;
	floorAreaSqm: number;
	leaseCommenceYear: number;
};

export type NormalizedPredictionRequest = {
	mlModel: MLModel;
	town: Town;
	storeyRange: StoreyRange;
	flatModel: FlatModel;
	floorAreaSqm: number;
	leaseCommenceYear: number;
};

export type PredictionApiResponse = {
	predictions: Array<{
		month: string;
		predictedPrice: number;
	}>;
};

export function clampFloorAreaSqm(value: number) {
	return Math.max(MIN_FLOOR_AREA_SQM, Math.min(MAX_FLOOR_AREA_SQM, Math.round(value)));
}

export function serializeLeaseCommenceDate(value: Temporal.PlainDate) {
	return value.toString();
}

export function normalizePredictionRequest(
	input: unknown
):
	| { ok: true; value: NormalizedPredictionRequest }
	| { ok: false; error: string } {
	const parsed = parseApiRequestInput(input);

	if (!parsed.success) {
		return { ok: false, error: zodErrorToApiMessage(parsed.error) };
	}

	return { ok: true, value: formValuesToNormalized(parsed.data) };
}
