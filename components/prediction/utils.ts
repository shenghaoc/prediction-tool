import type { ApiResponse, TrendPoint } from './types';

export function getErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error && error.message ? error.message : fallback;
}

export async function getResponseErrorMessage(response: Response, fallback: string) {
	const text = await response.text();
	if (!text) {
		return fallback;
	}

	try {
		const parsed = JSON.parse(text) as { error?: unknown };
		if (typeof parsed.error === 'string') {
			return parsed.error;
		}

		if (
			parsed.error &&
			typeof parsed.error === 'object' &&
			'message' in parsed.error &&
			typeof parsed.error.message === 'string'
		) {
			return parsed.error.message;
		}
	} catch {}

	return text;
}

export function isAbortError(error: unknown) {
	return error instanceof Error && error.name === 'AbortError';
}

export function normalizePrice(value: number) {
	if (!Number.isFinite(value)) {
		return 0;
	}

	return Math.max(0, Math.round(value));
}

export function normalizeTrendData(data: ApiResponse): TrendPoint[] {
	return data.predictions.map((entry) => ({
		label: entry.month,
		value: normalizePrice(entry.predictedPrice)
	}));
}
