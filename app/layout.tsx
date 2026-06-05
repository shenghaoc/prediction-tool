import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Source_Sans_3 } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { cookies } from 'next/headers';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { I18nProvider } from '../lib/i18n';
import { LANGUAGE_COOKIE, parseLang } from '../lib/locale';
import { STORAGE_KEYS } from '../lib/prediction';
import {
	SITE_DESCRIPTION,
	SITE_KEYWORDS,
	SITE_NAME,
	SITE_OG_IMAGE,
	SITE_URL
} from '../lib/site';

const sourceSans3 = Source_Sans_3({
	subsets: ['latin'],
	weight: ['300', '400', '500', '600', '700', '800', '900'],
	variable: '--font-source-sans',
	display: 'swap'
});

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
};

export const metadata: Metadata = {
	title: {
		default: SITE_NAME,
		template: `%s | ${SITE_NAME}`
	},
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	keywords: [...SITE_KEYWORDS],
	metadataBase: new URL(SITE_URL),
	alternates: {
		canonical: '/'
	},
	openGraph: {
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
		url: SITE_URL,
		siteName: SITE_NAME,
		locale: 'en_SG',
		type: 'website',
		images: [
			{
				url: SITE_OG_IMAGE,
				width: 1200,
				height: 630,
				alt: 'Prediction Tool HDB resale estimator overview'
			}
		]
	},
	twitter: {
		card: 'summary_large_image',
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
		images: [SITE_OG_IMAGE]
	},
	robots: {
		index: true,
		follow: true
	},
	category: 'finance'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const lang = parseLang((await cookies()).get(LANGUAGE_COOKIE)?.value);

	return (
		<html lang={lang} data-lang={lang} className={sourceSans3.variable} suppressHydrationWarning>
			<body>
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem={false}
					storageKey={STORAGE_KEYS.theme}
				>
					<I18nProvider initialLang={lang}>
						<TooltipProvider delayDuration={300}>{children}</TooltipProvider>
					</I18nProvider>
					<Toaster richColors closeButton />
				</ThemeProvider>
			</body>
		</html>
	);
}
