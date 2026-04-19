import { describe, expect, test } from 'bun:test';

import { normalizePrice, normalizeTrendData } from './utils';

describe('prediction ui utilities', () => {
	test('normalizes price values', () => {
		expect(normalizePrice(501234.6)).toBe(501235);
		expect(normalizePrice(-120)).toBe(0);
		expect(normalizePrice(Number.NaN)).toBe(0);
	});

	test('normalizes trend data into chart points', () => {
		expect(
			normalizeTrendData({
				predictions: [
					{ month: '2022-01', predictedPrice: 450000.1 },
					{ month: '2022-02', predictedPrice: Number.NaN }
				]
			})
		).toEqual([
			{ label: '2022-01', value: 450000 },
			{ label: '2022-02', value: 0 }
		]);
	});
});
