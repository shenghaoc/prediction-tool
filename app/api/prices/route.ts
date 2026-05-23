import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

import {
	DEFAULT_PREDICTION_MONTH_END,
	DEFAULT_PREDICTION_MONTH_START,
	normalizePredictionRequest
} from '../../../lib/prediction';

export const runtime = 'edge';

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

export async function POST(request: Request) {
	let requestBody: unknown;

	try {
		requestBody = await request.json();
	} catch {
		return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
	}

	const normalizedRequest = normalizePredictionRequest(requestBody);
	if (!normalizedRequest.ok) {
		return NextResponse.json({ error: normalizedRequest.error }, { status: 400 });
	}

	const { mlModel, town, flatModel, storeyRange, floorAreaSqm, leaseCommenceYear } =
		normalizedRequest.value;

	try {
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
			JOIN storey_ranges_ordinal ON storey_ranges_ordinal.name = :storeyRange
			JOIN months_ordinal ON months_ordinal.name BETWEEN :monthStart AND :monthEnd
			WHERE ml_models.name = :mlModel
				AND towns_onehot.name = :town
				AND flat_models_onehot.name = :flatModel
			ORDER BY months_ordinal.value ASC;`
		)
			.bind({
				mlModel,
				town,
				flatModel,
				monthStart: DEFAULT_PREDICTION_MONTH_START,
				monthEnd: DEFAULT_PREDICTION_MONTH_END,
				storeyRange
			})
			.all<PriceQueryRow>();

		const [first] = results;
		if (!first) {
			return NextResponse.json(
				{ error: 'No prediction data found for the given parameters.' },
				{ status: 500 }
			);
		}

		// All terms except month_multiplier are constant across rows (ml_models, towns_onehot,
		// flat_models_onehot, storey_ranges_ordinal join to exactly one row each).
		// Compute them once from the first result to avoid redundant work per month.
		const baseValue =
			readNumericField(first.intercept_map, 'intercept_map') +
			readNumericField(first.town_map, 'town_map') +
			readNumericField(first.storey_range_multiplier, 'storey_range_multiplier') *
				readNumericField(first.storey_range_map, 'storey_range_map') +
			floorAreaSqm * readNumericField(first.floor_area_sqm_map, 'floor_area_sqm_map') +
			readNumericField(first.flat_model_map, 'flat_model_map') +
			leaseCommenceYear *
				readNumericField(first.lease_commence_date_map, 'lease_commence_date_map');
		const monthCoefficient = readNumericField(first.month_map, 'month_map');

		const predictions = results.map((row) => {
			const predictedRaw =
				baseValue +
				readNumericField(row.month_multiplier, 'month_multiplier') * monthCoefficient;

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

		return NextResponse.json({ predictions });
	} catch (error: unknown) {
		console.error(error);
		return NextResponse.json(
			{
				error:
					error instanceof Error && error.message
						? error.message
						: 'Prediction service unavailable.'
			},
			{ status: 500 }
		);
	}
}
