import { NextResponse } from 'next/server';

import {
	buildPredictionUpstreamFormData,
	isPredictionApiResponse,
	normalizePredictionRequest
} from '../../../lib/prediction';

const PRICES_API_URL =
	process.env.PRICES_API_URL ??
	'https://ee4802-g20-tool.shenghaoc.workers.dev/api/prices';

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

	try {
		const response = await fetch(PRICES_API_URL, {
			method: 'POST',
			body: buildPredictionUpstreamFormData(normalizedRequest.value),
			cache: 'no-store'
		});

		if (!response.ok) {
			const errorText = await response.text();
			return NextResponse.json(
				{
					error: errorText || 'Prediction service request failed.'
				},
				{ status: 502 }
			);
		}

		const responseBody: unknown = await response.json();
		if (!isPredictionApiResponse(responseBody)) {
			return NextResponse.json(
				{ error: 'Prediction service returned an invalid response.' },
				{ status: 502 }
			);
		}

		return NextResponse.json(responseBody);
	} catch (error: unknown) {
		return NextResponse.json(
			{
				error:
					error instanceof Error && error.message
						? error.message
						: 'Prediction service unavailable.'
			},
			{ status: 502 }
		);
	}
}
