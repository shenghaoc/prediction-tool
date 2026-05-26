import { describe, expect, test, vi } from 'vitest';

vi.mock('@opennextjs/cloudflare', () => ({
	initOpenNextCloudflareForDev: vi.fn()
}));

const { default: nextConfig } = await import('./next.config.js');

describe('next security headers configuration', () => {
	test('applies the expected security headers to all routes', async () => {
		expect(nextConfig.headers).toEqual(expect.any(Function));

		const headerRules = await nextConfig.headers();

		expect(headerRules).toHaveLength(1);
		expect(headerRules[0].source).toBe('/:path*');

		const configuredHeaders = headerRules[0].headers;
		const headerKeys = configuredHeaders.map(({ key }) => key);

		expect(new Set(headerKeys).size).toBe(headerKeys.length);
		expect(Object.fromEntries(configuredHeaders.map(({ key, value }) => [key, value]))).toEqual({
			'X-Content-Type-Options': 'nosniff',
			'X-Frame-Options': 'DENY',
			'Referrer-Policy': 'strict-origin-when-cross-origin',
			'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
		});
	});
});
