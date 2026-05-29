import { getCloudflareContext } from '@opennextjs/cloudflare';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { POST } from './route';

vi.mock('@opennextjs/cloudflare', () => ({
	getCloudflareContext: vi.fn()
}));

const validRequestBody = {
	mlModel: 'Ridge Regression',
	town: 'BEDOK',
	storeyRange: '10 TO 12',
	flatModel: 'Model A',
	floorAreaSqm: 82,
	leaseCommenceYear: 2022
};

const sensitiveDbError = 'Database field intercept_map is not a finite number';

function createPostRequest(body: unknown = validRequestBody) {
	return new Request('http://localhost/api/prices', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
}

function mockDbWithInvalidNumericField() {
	const mockAll = vi.fn().mockResolvedValue({
		results: [
			{
				intercept_map: Number.NaN,
				month_map: 1,
				storey_range_map: 1,
				floor_area_sqm_map: 1,
				lease_commence_date_map: 1,
				month_name: '2022-02',
				month_multiplier: 1,
				town_map: 1,
				flat_model_map: 1,
				storey_range_multiplier: 1
			}
		]
	});
	const mockBind = vi.fn().mockReturnValue({ all: mockAll });
	const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });

	vi.mocked(getCloudflareContext).mockReturnValue({
		env: { DB: { prepare: mockPrepare } }
	} as ReturnType<typeof getCloudflareContext>);
}

function mockDbWithNoResults() {
	const mockAll = vi.fn().mockResolvedValue({ results: [] });
	const mockBind = vi.fn().mockReturnValue({ all: mockAll });
	const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });

	vi.mocked(getCloudflareContext).mockReturnValue({
		env: { DB: { prepare: mockPrepare } }
	} as ReturnType<typeof getCloudflareContext>);
}

function mockDbThatThrows(message: string) {
	const mockAll = vi.fn().mockRejectedValue(new Error(message));
	const mockBind = vi.fn().mockReturnValue({ all: mockAll });
	const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });

	vi.mocked(getCloudflareContext).mockReturnValue({
		env: { DB: { prepare: mockPrepare } }
	} as ReturnType<typeof getCloudflareContext>);
}

describe('POST /api/prices error responses', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('returns a generic message when calculation fails on invalid DB numerics', async () => {
		mockDbWithInvalidNumericField();

		const response = await POST(createPostRequest());
		const body = (await response.json()) as { error?: string };

		expect(response.status).toBe(500);
		expect(body.error).toBe('Prediction service unavailable.');
		expect(JSON.stringify(body)).not.toContain('intercept_map');
		expect(JSON.stringify(body)).not.toContain(sensitiveDbError);
	});

	test('returns 404 when no prediction data matches the request', async () => {
		mockDbWithNoResults();

		const response = await POST(createPostRequest());
		const body = (await response.json()) as { error?: string };

		expect(response.status).toBe(404);
		expect(body.error).toBe('No prediction data found for the given parameters.');
	});

	test('does not expose internal error.message from database failures', async () => {
		mockDbThatThrows(sensitiveDbError);

		const response = await POST(createPostRequest());
		const body = (await response.json()) as { error?: string };

		expect(response.status).toBe(500);
		expect(body.error).toBe('Prediction service unavailable.');
		expect(JSON.stringify(body)).not.toContain(sensitiveDbError);
	});
});

describe('POST /api/prices payload length', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('returns 413 when request payload is too large', async () => {
		const largeBody = { ...validRequestBody, extra: 'a'.repeat(3000) };
		const response = await POST(createPostRequest(largeBody));
		const body = (await response.json()) as { error?: string };

		expect(response.status).toBe(413);
		expect(body.error).toBe('Request payload too large.');
	});

	test('does not reject payload of exactly 2048 characters', async () => {
		const request = new Request('http://localhost/api/prices', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: 'a'.repeat(2048)
		});
		const response = await POST(request);
		expect(response.status).not.toBe(413);
	});

	test('rejects payload of exactly 2049 characters', async () => {
		const request = new Request('http://localhost/api/prices', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: 'a'.repeat(2049)
		});
		const response = await POST(request);

		expect(response.status).toBe(413);
	});

	test('rejects requests without application/json content-type', async () => {
		const request = new Request('http://localhost/api/prices', {
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },
			body: JSON.stringify(validRequestBody)
		});
		const response = await POST(request);

		expect(response.status).toBe(415);
	});
});
