'use server';

import { PredictionNotFoundError, runPrediction } from '../../lib/run-prediction';
import type { PredictionApiResponse } from '../../lib/prediction';
import {
	formValuesToNormalized,
	parseFormDataInput,
	zodErrorToFieldErrors
} from '../../lib/prediction-schema';

export type PredictActionState =
	| { ok: true; predictions: PredictionApiResponse['predictions'] }
	| { ok: false; fieldErrors?: Record<string, string[]>; formError?: string }
	| null;

export async function predictAction(
	_prevState: PredictActionState,
	formData: FormData
): Promise<PredictActionState> {
	const parsed = parseFormDataInput(formData);

	if (!parsed.success) {
		return {
			ok: false,
			fieldErrors: zodErrorToFieldErrors(parsed.error)
		};
	}

	try {
		const predictions = await runPrediction(formValuesToNormalized(parsed.data));
		return { ok: true, predictions };
	} catch (error: unknown) {
		if (error instanceof PredictionNotFoundError) {
			return { ok: false, formError: 'error_no_prediction_data' };
		}

		console.error('[Predict Action Error]', error);
		return { ok: false, formError: 'error_fetch' };
	}
}
