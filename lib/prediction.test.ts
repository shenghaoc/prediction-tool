import {
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
