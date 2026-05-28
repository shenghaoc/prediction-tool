export type Lang = 'en' | 'zh';

// Stored as a cookie (not localStorage) so the server can render the correct
// language on the first request and avoid a hydration mismatch.
export const LANGUAGE_COOKIE = 'prediction-tool-lang';

export function parseLang(value: string | undefined | null): Lang {
	return value === 'zh' ? 'zh' : 'en';
}
