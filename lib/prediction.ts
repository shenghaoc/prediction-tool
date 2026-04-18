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
export const DEFAULT_LEASE_COMMENCE_DATE = '2022-02-01';
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
	leaseCommenceDate: string;
};

export type NormalizedPredictionRequest = {
	mlModel: MLModel;
	town: Town;
	storeyRange: StoreyRange;
	flatModel: FlatModel;
	floorAreaSqm: number;
	leaseCommenceDate: string;
};

export type PredictionApiResponse = { labels: string; data: number }[];

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
	const leaseCommenceDate = input.leaseCommenceDate;

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

	if (typeof leaseCommenceDate !== 'string') {
		return { ok: false, error: 'Invalid lease commence date.' };
	}

	const parsedLeaseCommenceDate = dayjs.utc(
		leaseCommenceDate,
		LEASE_COMMENCE_DATE_FORMAT,
		true
	);

	if (!parsedLeaseCommenceDate.isValid()) {
		return { ok: false, error: 'Invalid lease commence date.' };
	}

	const leaseCommenceYear = parsedLeaseCommenceDate.year();
	if (
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
			leaseCommenceDate: parsedLeaseCommenceDate.format(LEASE_COMMENCE_DATE_FORMAT)
		}
	};
}

export function buildPredictionUpstreamFormData(input: NormalizedPredictionRequest) {
	const leaseCommenceDate = dayjs.utc(
		input.leaseCommenceDate,
		LEASE_COMMENCE_DATE_FORMAT,
		true
	);
	const formData = new FormData();

	formData.append('ml_model', input.mlModel);
	formData.append('month_start', leaseCommenceDate.subtract(12, 'month').format('YYYY-MM'));
	formData.append('month_end', leaseCommenceDate.format('YYYY-MM'));
	formData.append('town', input.town);
	formData.append('storey_range', input.storeyRange);
	formData.append('flat_model', input.flatModel);
	formData.append('floor_area_sqm', input.floorAreaSqm.toString());
	formData.append('lease_commence_date', leaseCommenceDate.year().toString());

	return formData;
}

export function isPredictionApiResponse(value: unknown): value is PredictionApiResponse {
	return (
		Array.isArray(value) &&
		value.every((entry) => {
			if (!isRecord(entry)) {
				return false;
			}

			return (
				typeof entry.labels === 'string' &&
				typeof entry.data === 'number' &&
				Number.isFinite(entry.data)
			);
		})
	);
}
