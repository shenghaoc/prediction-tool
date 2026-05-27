import './globals.css';
import type { Metadata } from 'next';
import { Source_Sans_3 } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={sourceSans3.variable}>
			<body>
				<TooltipProvider delayDuration={300}>{children}</TooltipProvider>
				<Toaster richColors closeButton />
			</body>
		</html>
	);
}
