import './globals.css';
import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App as AntdApp, ConfigProvider } from 'antd';
import {
	SITE_DESCRIPTION,
	SITE_KEYWORDS,
	SITE_NAME,
	SITE_OG_IMAGE,
	SITE_URL
} from '../lib/site';

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
		<html lang="en">
			<body>
				<AntdRegistry>
					<ConfigProvider
						theme={{
							token: {
								borderRadius: 20,
								fontFamily: 'var(--font-body), "PingFang SC", "Noto Sans SC", sans-serif'
							},
							components: {
								Button: {
									fontWeight: 700,
									borderRadius: 999
								},
								Card: {
									bodyPadding: 0
								},
								InputNumber: {
									controlHeightLG: 52
								},
								DatePicker: {
									controlHeightLG: 52
								},
								Select: {
									controlHeightLG: 52
								}
							}
						}}
					>
						<AntdApp>{children}</AntdApp>
					</ConfigProvider>
				</AntdRegistry>
			</body>
		</html>
	);
}
