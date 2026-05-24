'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

import en from '../app/locales/en.json';
import zh from '../app/locales/zh.json';
import { STORAGE_KEYS } from './prediction';

type Translations = Record<string, string | Record<string, string>>;
const RESOURCES: Record<string, Translations> = { en, zh };

function lookup(translations: Translations, key: string): string {
	const parts = key.split('.');
	let current: unknown = translations;
	for (const part of parts) {
		if (typeof current !== 'object' || current === null) return key;
		current = (current as Record<string, unknown>)[part];
	}
	return typeof current === 'string' ? current : key;
}

export type TFunction = (key: string, fallback?: string) => string;

type I18nContextValue = {
	t: TFunction;
	lang: string;
	changeLang: (lang: string) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
	const [lang, setLang] = useState(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem(STORAGE_KEYS.language) ?? 'en';
		}
		return 'en';
	});

	const changeLang = useCallback((l: string) => {
		setLang(l);
		try {
			localStorage.setItem(STORAGE_KEYS.language, l);
		} catch {
			/* quota exceeded — can't persist */
		}
	}, []);

	const t: TFunction = useCallback(
		(key: string, fallback?: string) => {
			const translations = RESOURCES[lang] ?? RESOURCES.en;
			const result = lookup(translations, key);
			return result === key && fallback !== undefined ? fallback : result;
		},
		[lang]
	);

	useEffect(() => {
		document.documentElement.lang = lang;
		document.documentElement.setAttribute('data-lang', lang);
	}, [lang]);

	return <I18nContext.Provider value={{ t, lang, changeLang }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
	const ctx = useContext(I18nContext);
	if (!ctx) throw new Error('useI18n must be used within I18nProvider');
	return ctx;
}
