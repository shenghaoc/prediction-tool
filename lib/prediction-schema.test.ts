import { describe, expect, test } from 'vitest';

import {
	predictionFormSchema,
	parseApiRequestInput,
	parseFormDataInput
} from './prediction-schema';

describe('prediction schema', () => {
	test('accepts valid form values', () => {
		const result = predictionFormSchema.safeParse({
			ml_model: 'Ridge Regression',
			town: 'BEDOK',
			storey_range: '10 TO 12',
			flat_model: 'Model A',
			floor_area_sqm: 82,
			lease_commence_year: 2022
		});

		expect(result.success).toBe(true);
	});

	test('rejects out-of-range floor area before server call', () => {
		const result = predictionFormSchema.safeParse({
			ml_model: 'Ridge Regression',
			town: 'BEDOK',
			storey_range: '10 TO 12',
			flat_model: 'Model A',
			floor_area_sqm: 19,
			lease_commence_year: 2022
		});

		expect(result.success).toBe(false);
	});

	test('clamps API floor area decimals to integer bounds', () => {
		const result = parseApiRequestInput({
			mlModel: 'Ridge Regression',
			town: 'BEDOK',
			storeyRange: '10 TO 12',
			flatModel: 'Model A',
			floorAreaSqm: 81.8,
			leaseCommenceYear: 2022
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.floor_area_sqm).toBe(82);
		}
	});

	test('parses form data for server actions', () => {
		const formData = new FormData();
		formData.set('ml_model', 'Ridge Regression');
		formData.set('town', 'BEDOK');
		formData.set('storey_range', '10 TO 12');
		formData.set('flat_model', 'Model A');
		formData.set('floor_area_sqm', '82');
		formData.set('lease_commence_year', '2022');

		const result = parseFormDataInput(formData);
		expect(result.success).toBe(true);
	});
});
