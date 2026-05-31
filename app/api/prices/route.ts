import { NextResponse } from 'next/server';

import { normalizePredictionRequest } from '../../../lib/prediction';
import { PredictionNotFoundError, runPrediction } from '../../../lib/run-prediction';

export async function POST(request: Request) {
	const contentType = request.headers.get('content-type') || '';
	const mimeType = contentType.split(';')[0].trim().toLowerCase();
	if (mimeType !== 'application/json') {
		return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 });
	}

	let requestBody: unknown;

	try {
		const contentLength = request.headers.get('content-length');
		if (contentLength !== null) {
			const length = Number(contentLength);
			if (Number.isNaN(length) || length < 0 || length > 2048) {
				return NextResponse.json({ error: 'Request payload too large.' }, { status: 413 });
			}
		}
		const rawBody = await request.text();
		if (rawBody.length > 2048) {
			return NextResponse.json({ error: 'Request payload too large.' }, { status: 413 });
		}
		requestBody = JSON.parse(rawBody);
	} catch {
		return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
	}

	const normalizedRequest = normalizePredictionRequest(requestBody);
	if (!normalizedRequest.ok) {
		return NextResponse.json({ error: normalizedRequest.error }, { status: 400 });
	}

	try {
		const predictions = await runPrediction(normalizedRequest.value);
		return NextResponse.json({ predictions });
	} catch (error: unknown) {
		if (error instanceof PredictionNotFoundError) {
			return NextResponse.json({ error: error.message }, { status: 404 });
		}

		console.error('[API Error]', error);
		return NextResponse.json(
			{
				error: 'Prediction service unavailable.'
			},
			{ status: 500 }
		);
	}
}
