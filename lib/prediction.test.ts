import { describe, expect, test } from 'bun:test';

import {
	buildPredictionUpstreamFormData,
	clampFloorAreaSqm,
	isPredictionApiResponse,
	normalizePredictionRequest
} from './prediction';

describe('prediction request helpers', () => {
	test('clamps floor area to supported bounds', () => {
		expect(clampFloorAreaSqm(18.2)).toBe(20);
		expect(clampFloorAreaSqm(81.8)).toBe(82);
		expect(clampFloorAreaSqm(500)).toBe(300);
	});

		test('normalizes valid requests', () => {
			const result = normalizePredictionRequest({
				mlModel: 'Ridge Regression',
				town: 'BEDOK',
				storeyRange: '10 TO 12',
				flatModel: 'Model A',
				floorAreaSqm: 81.8,
				leaseCommenceYear: 2022
			});

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}

		expect(result.value.floorAreaSqm).toBe(82);
			expect(result.value.leaseCommenceYear).toBe(2022);
	});

	test('rejects invalid enum values', () => {
		const result = normalizePredictionRequest({
				mlModel: 'Random Forest',
				town: 'BEDOK',
				storeyRange: '10 TO 12',
				flatModel: 'Model A',
				floorAreaSqm: 82,
				leaseCommenceYear: 2022
			});

		expect(result).toEqual({
			ok: false,
			error: 'Invalid ML model.'
		});
	});

	test('builds the upstream form payload', () => {
		const normalized = normalizePredictionRequest({
				mlModel: 'Support Vector Regression',
				town: 'QUEENSTOWN',
				storeyRange: '22 TO 24',
				flatModel: 'Premium Apartment',
				floorAreaSqm: 95,
				leaseCommenceYear: 2022
			});

		expect(normalized.ok).toBe(true);
		if (!normalized.ok) {
			return;
		}

		const formData = buildPredictionUpstreamFormData(normalized.value);
		expect(formData.get('model')).toBe('Support Vector Regression');
		expect(formData.get('monthStart')).toBe('2021-02');
		expect(formData.get('monthEnd')).toBe('2022-02');
		expect(formData.get('leaseCommenceYear')).toBe('2022');
		expect(formData.get('floorAreaSqm')).toBe('95');
	});
});

describe('prediction api response guard', () => {
	test('accepts valid response payloads', () => {
		expect(
			isPredictionApiResponse({
				predictions: [
					{ month: '2022-01', predictedPrice: 512345 },
					{ month: '2022-02', predictedPrice: 518999 }
				]
			})
		).toBe(true);
	});

	test('rejects malformed payloads', () => {
		expect(
			isPredictionApiResponse({
				predictions: [{ month: '2022-01', predictedPrice: '512345' }]
			})
		).toBe(false);
	});
});
