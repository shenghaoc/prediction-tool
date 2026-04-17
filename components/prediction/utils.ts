import type { ApiResponse, TrendPoint } from './types';

export function getErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error && error.message ? error.message : fallback;
}

export function normalizePrice(value: number) {
	if (!Number.isFinite(value)) {
		return 0;
	}

	return Math.max(0, Math.round(value));
}

export function normalizeTrendData(data: ApiResponse): TrendPoint[] {
	return data.map((entry) => ({
		label: entry.labels,
		value: normalizePrice(entry.data)
	}));
}
