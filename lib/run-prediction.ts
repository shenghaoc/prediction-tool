import { getCloudflareContext } from '@opennextjs/cloudflare';

import {
	DEFAULT_PREDICTION_MONTH_END,
	DEFAULT_PREDICTION_MONTH_START,
	type NormalizedPredictionRequest,
	type PredictionApiResponse
} from './prediction';

type PriceQueryRow = {
	intercept_map: number;
	month_map: number;
	storey_range_map: number;
	floor_area_sqm_map: number;
	lease_commence_date_map: number;
	month_name: string;
	month_multiplier: number;
	town_map: number;
	flat_model_map: number;
	storey_range_multiplier: number;
};

function readNumericField(value: unknown, fieldName: string): number {
	const numericValue = Number(value);
	if (!Number.isFinite(numericValue)) {
		throw new Error(`Database field ${fieldName} is not a finite number`);
	}
	return numericValue;
}

function roundToTwo(value: number): number {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

export class PredictionNotFoundError extends Error {
	constructor() {
		super('No prediction data found for the given parameters.');
		this.name = 'PredictionNotFoundError';
	}
}

export async function runPrediction(
	request: NormalizedPredictionRequest
): Promise<PredictionApiResponse['predictions']> {
	const { mlModel, town, flatModel, storeyRange, floorAreaSqm, leaseCommenceYear } = request;

	const { env } = getCloudflareContext();
	const { results } = await env.DB.prepare(
		`SELECT
			ml_models.intercept_map,
			ml_models.month_map,
			ml_models.storey_range_map,
			ml_models.floor_area_sqm_map,
			ml_models.lease_commence_date_map,
			months_ordinal.name AS month_name,
			months_ordinal.value AS month_multiplier,
			towns_onehot.value AS town_map,
			flat_models_onehot.value AS flat_model_map,
			storey_ranges_ordinal.value AS storey_range_multiplier
		FROM ml_models
		JOIN towns_onehot ON ml_models.name = towns_onehot.ml_model
		JOIN flat_models_onehot ON ml_models.name = flat_models_onehot.ml_model
		JOIN storey_ranges_ordinal ON storey_ranges_ordinal.name = ?6
		JOIN months_ordinal ON months_ordinal.name BETWEEN ?4 AND ?5
		WHERE ml_models.name = ?1
			AND towns_onehot.name = ?2
			AND flat_models_onehot.name = ?3
		ORDER BY months_ordinal.value ASC;`
	)
		.bind(
			mlModel,
			town,
			flatModel,
			DEFAULT_PREDICTION_MONTH_START,
			DEFAULT_PREDICTION_MONTH_END,
			storeyRange
		)
		.all<PriceQueryRow>();

	const [first] = results;
	if (!first) {
		throw new PredictionNotFoundError();
	}

	const baseValue =
		readNumericField(first.intercept_map, 'intercept_map') +
		readNumericField(first.town_map, 'town_map') +
		readNumericField(first.storey_range_multiplier, 'storey_range_multiplier') *
			readNumericField(first.storey_range_map, 'storey_range_map') +
		floorAreaSqm * readNumericField(first.floor_area_sqm_map, 'floor_area_sqm_map') +
		readNumericField(first.flat_model_map, 'flat_model_map') +
		leaseCommenceYear * readNumericField(first.lease_commence_date_map, 'lease_commence_date_map');
	const monthCoefficient = readNumericField(first.month_map, 'month_map');

	return results.map((row) => {
		const predictedRaw =
			baseValue + readNumericField(row.month_multiplier, 'month_multiplier') * monthCoefficient;

		if (!Number.isFinite(predictedRaw)) {
			throw new Error(
				`Prediction calculation produced non-finite value for month ${row.month_name}`
			);
		}

		return {
			month: row.month_name,
			predictedPrice: roundToTwo(Math.max(0, predictedRaw))
		};
	});
}
