import dayjs from './dayjs';
import {
	FLAT_MODELS,
	ML_MODELS,
	STOREY_RANGES,
	TOWNS,
	type FlatModel,
	type MLModel,
	type StoreyRange,
	type Town
} from './lists';

export const STORAGE_KEYS = {
	theme: 'prediction-tool:theme',
	language: 'prediction-tool:language',
	form: 'prediction-tool:form'
} as const;

export const LEASE_COMMENCE_DATE_FORMAT = 'YYYY-MM-DD';
export const DEFAULT_PREDICTION_MONTH_END = '2022-02';
export const DEFAULT_PREDICTION_MONTH_START = dayjs
	.utc(DEFAULT_PREDICTION_MONTH_END, 'YYYY-MM', true)
	.subtract(12, 'month')
	.format('YYYY-MM');
export const DEFAULT_LEASE_COMMENCE_DATE = `${new Date().getUTCFullYear()}-01-01`;
export const MIN_FLOOR_AREA_SQM = 20;
export const MAX_FLOOR_AREA_SQM = 300;
export const MIN_LEASE_COMMENCE_YEAR = 1960;
export const MAX_LEASE_COMMENCE_YEAR = new Date().getUTCFullYear();

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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isOneOf<T extends string>(value: string, options: readonly T[]): value is T {
	return options.includes(value as T);
}

export function clampFloorAreaSqm(value: number) {
	return Math.max(MIN_FLOOR_AREA_SQM, Math.min(MAX_FLOOR_AREA_SQM, Math.round(value)));
}

export function serializeLeaseCommenceDate(value: { format: (format: string) => string }) {
	return value.format(LEASE_COMMENCE_DATE_FORMAT);
}

export function normalizePredictionRequest(
	input: unknown
):
	| { ok: true; value: NormalizedPredictionRequest }
	| { ok: false; error: string } {
	if (!isRecord(input)) {
		return { ok: false, error: 'Invalid request body.' };
	}

	const mlModel = input.mlModel;
	const town = input.town;
	const storeyRange = input.storeyRange;
	const flatModel = input.flatModel;
	const floorAreaSqm = input.floorAreaSqm;
	const leaseCommenceYear = input.leaseCommenceYear;

	if (typeof mlModel !== 'string' || !isOneOf(mlModel, ML_MODELS)) {
		return { ok: false, error: 'Invalid ML model.' };
	}

	if (typeof town !== 'string' || !isOneOf(town, TOWNS)) {
		return { ok: false, error: 'Invalid town.' };
	}

	if (typeof storeyRange !== 'string' || !isOneOf(storeyRange, STOREY_RANGES)) {
		return { ok: false, error: 'Invalid storey range.' };
	}

	if (typeof flatModel !== 'string' || !isOneOf(flatModel, FLAT_MODELS)) {
		return { ok: false, error: 'Invalid flat model.' };
	}

	if (typeof floorAreaSqm !== 'number' || !Number.isFinite(floorAreaSqm)) {
		return { ok: false, error: 'Invalid floor area.' };
	}

	if (
		typeof leaseCommenceYear !== 'number' ||
		!Number.isInteger(leaseCommenceYear) ||
		leaseCommenceYear < MIN_LEASE_COMMENCE_YEAR ||
		leaseCommenceYear > MAX_LEASE_COMMENCE_YEAR
	) {
		return {
			ok: false,
			error: `Lease commence year must be between ${MIN_LEASE_COMMENCE_YEAR} and ${MAX_LEASE_COMMENCE_YEAR}.`
		};
	}

	return {
		ok: true,
		value: {
				mlModel,
				town,
				storeyRange,
				flatModel,
				floorAreaSqm: clampFloorAreaSqm(floorAreaSqm),
				leaseCommenceYear
			}
		};
}

export function buildPredictionUpstreamFormData(input: NormalizedPredictionRequest) {
	const formData = new FormData();

	formData.append('model', input.mlModel);
	formData.append('town', input.town);
	formData.append('storeyRange', input.storeyRange);
	formData.append('flatModel', input.flatModel);
	formData.append('floorAreaSqm', input.floorAreaSqm.toString());
	formData.append('leaseCommenceYear', input.leaseCommenceYear.toString());
	formData.append('monthStart', DEFAULT_PREDICTION_MONTH_START);
	formData.append('monthEnd', DEFAULT_PREDICTION_MONTH_END);

	return formData;
}

export function isPredictionApiResponse(value: unknown): value is PredictionApiResponse {
	if (!isRecord(value) || !Array.isArray(value.predictions)) {
		return false;
	}

	return value.predictions.every((entry) => {
			if (!isRecord(entry)) {
				return false;
			}

			return (
				typeof entry.month === 'string' &&
				typeof entry.predictedPrice === 'number' &&
				Number.isFinite(entry.predictedPrice)
			);
		});
}
