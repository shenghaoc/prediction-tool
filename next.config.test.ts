// @vitest-environment node

import { beforeAll, describe, expect, test, vi } from 'vitest';

vi.mock('@opennextjs/cloudflare', () => ({
	initOpenNextCloudflareForDev: vi.fn()
}));

let nextConfig: Awaited<typeof import('./next.config.js')>['default'];

beforeAll(async () => {
	({ default: nextConfig } = await import('./next.config.js'));
});

describe('next security headers configuration', () => {
	test('applies the expected security headers to all routes', async () => {
		expect(nextConfig!.headers).toEqual(expect.any(Function));

		const headerRules = await nextConfig!.headers();

		expect(headerRules).toHaveLength(1);
		expect(headerRules[0].source).toBe('/:path*');

		const configuredHeaders = headerRules[0].headers;
		const headerKeys = configuredHeaders.map(({ key }) => key);

		expect(new Set(headerKeys).size).toBe(headerKeys.length);
		expect(Object.fromEntries(configuredHeaders.map(({ key, value }) => [key, value]))).toEqual({
			'X-Content-Type-Options': 'nosniff',
			'X-Frame-Options': 'DENY',
			'Referrer-Policy': 'strict-origin-when-cross-origin',
			'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
			'Content-Security-Policy':
				"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;",
			'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
		});
	});
});
