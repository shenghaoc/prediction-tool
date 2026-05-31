import { z } from 'zod';

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
import {
	clampFloorAreaSqm,
	MAX_FLOOR_AREA_SQM,
	MAX_LEASE_COMMENCE_YEAR,
	MIN_FLOOR_AREA_SQM,
	MIN_LEASE_COMMENCE_YEAR,
	type NormalizedPredictionRequest,
	type PredictionRequestBody
} from './prediction';

export const VALIDATION_KEYS = {
	ml_model: 'validation.ml_model',
	town: 'validation.town',
	storey_range: 'validation.storey_range',
	flat_model: 'validation.flat_model',
	floor_area_sqm: 'validation.floor_area_sqm',
	floor_area_sqm_min: 'validation.floor_area_sqm_min',
	floor_area_sqm_max: 'validation.floor_area_sqm_max',
	lease_commence_year: 'validation.lease_commence_year',
	lease_commence_year_min: 'validation.lease_commence_year_min',
	lease_commence_year_max: 'validation.lease_commence_year_max'
} as const;

const enumField = <T extends readonly [string, ...string[]]>(values: T, message: string) =>
	z.enum(values, { message });

function applyFloorAreaRules(schema: z.ZodNumber) {
	return schema
		.refine(Number.isFinite, { message: VALIDATION_KEYS.floor_area_sqm })
		.refine(Number.isInteger, { message: VALIDATION_KEYS.floor_area_sqm })
		.refine((value) => value >= MIN_FLOOR_AREA_SQM, { message: VALIDATION_KEYS.floor_area_sqm_min })
		.refine((value) => value <= MAX_FLOOR_AREA_SQM, { message: VALIDATION_KEYS.floor_area_sqm_max });
}

function applyLeaseYearRules(schema: z.ZodNumber) {
	return schema
		.refine(Number.isInteger, { message: VALIDATION_KEYS.lease_commence_year })
		.refine((value) => value >= MIN_LEASE_COMMENCE_YEAR, {
			message: VALIDATION_KEYS.lease_commence_year_min
		})
		.refine((value) => value <= MAX_LEASE_COMMENCE_YEAR, {
			message: VALIDATION_KEYS.lease_commence_year_max
		});
}

const strictFloorAreaSqm = applyFloorAreaRules(
	z.number({ message: VALIDATION_KEYS.floor_area_sqm })
);

const clampingFloorAreaSqm = z.coerce
	.number({ message: VALIDATION_KEYS.floor_area_sqm })
	.refine(Number.isFinite, { message: VALIDATION_KEYS.floor_area_sqm })
	.transform(clampFloorAreaSqm)
	.pipe(applyFloorAreaRules(z.number({ message: VALIDATION_KEYS.floor_area_sqm })));

const strictLeaseCommenceYear = applyLeaseYearRules(
	z.number({ message: VALIDATION_KEYS.lease_commence_year })
);

const coercedLeaseCommenceYear = applyLeaseYearRules(
	z.coerce.number({ message: VALIDATION_KEYS.lease_commence_year })
);

function createPredictionSchema(
	floorAreaSqm: z.ZodType<number>,
	leaseCommenceYear: z.ZodType<number>
) {
	return z.object({
		ml_model: enumField(ML_MODELS, VALIDATION_KEYS.ml_model),
		town: enumField(TOWNS, VALIDATION_KEYS.town),
		storey_range: enumField(STOREY_RANGES, VALIDATION_KEYS.storey_range),
		flat_model: enumField(FLAT_MODELS, VALIDATION_KEYS.flat_model),
		floor_area_sqm: floorAreaSqm,
		lease_commence_year: leaseCommenceYear
	});
}

export const predictionFormSchema = createPredictionSchema(
	strictFloorAreaSqm,
	strictLeaseCommenceYear
);
export const predictionApiInputSchema = createPredictionSchema(
	clampingFloorAreaSqm,
	coercedLeaseCommenceYear
);

export type PredictionFormValues = z.infer<typeof predictionFormSchema>;

export function formValuesToApiBody(values: PredictionFormValues): PredictionRequestBody {
	return {
		mlModel: values.ml_model,
		town: values.town,
		storeyRange: values.storey_range,
		flatModel: values.flat_model,
		floorAreaSqm: values.floor_area_sqm,
		leaseCommenceYear: values.lease_commence_year
	};
}

export function formValuesToNormalized(values: PredictionFormValues): NormalizedPredictionRequest {
	const body = formValuesToApiBody(values);
	return {
		mlModel: body.mlModel as MLModel,
		town: body.town as Town,
		storeyRange: body.storeyRange as StoreyRange,
		flatModel: body.flatModel as FlatModel,
		floorAreaSqm: body.floorAreaSqm,
		leaseCommenceYear: body.leaseCommenceYear
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function parseApiRequestInput(input: unknown) {
	if (!isRecord(input)) {
		return predictionApiInputSchema.safeParse(input);
	}

	return predictionApiInputSchema.safeParse({
		ml_model: input.mlModel,
		town: input.town,
		storey_range: input.storeyRange,
		flat_model: input.flatModel,
		floor_area_sqm: input.floorAreaSqm,
		lease_commence_year: input.leaseCommenceYear
	});
}

export function parseFormDataInput(formData: FormData) {
	return predictionApiInputSchema.safeParse({
		ml_model: formData.get('ml_model'),
		town: formData.get('town'),
		storey_range: formData.get('storey_range'),
		flat_model: formData.get('flat_model'),
		floor_area_sqm: formData.get('floor_area_sqm'),
		lease_commence_year: formData.get('lease_commence_year')
	});
}

export function zodErrorToFieldErrors(error: z.ZodError): Record<string, string[]> {
	const fieldErrors: Record<string, string[]> = {};

	for (const issue of error.issues) {
		const field = issue.path[0];
		if (typeof field !== 'string') continue;
		const message = issue.message;
		fieldErrors[field] = fieldErrors[field] ? [...fieldErrors[field], message] : [message];
	}

	return fieldErrors;
}

export function zodErrorToApiMessage(error: z.ZodError): string {
	const field = error.issues[0]?.path[0];

	switch (field) {
		case 'ml_model':
			return 'Invalid ML model.';
		case 'town':
			return 'Invalid town.';
		case 'storey_range':
			return 'Invalid storey range.';
		case 'flat_model':
			return 'Invalid flat model.';
		case 'floor_area_sqm':
			return 'Invalid floor area.';
		case 'lease_commence_year':
			return `Lease commence year must be between ${MIN_LEASE_COMMENCE_YEAR} and ${MAX_LEASE_COMMENCE_YEAR}.`;
		default:
			return 'Invalid request body.';
	}
}

export function predictionFormValuesToFormData(values: PredictionFormValues): FormData {
	const formData = new FormData();
	formData.set('ml_model', values.ml_model);
	formData.set('town', values.town);
	formData.set('storey_range', values.storey_range);
	formData.set('flat_model', values.flat_model);
	formData.set('floor_area_sqm', String(values.floor_area_sqm));
	formData.set('lease_commence_year', String(values.lease_commence_year));
	return formData;
}
