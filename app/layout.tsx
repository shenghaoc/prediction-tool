import './globals.css';
import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App as AntdApp, ConfigProvider } from 'antd';

export const metadata: Metadata = {
	title: 'Prediction Tool',
	description: 'An app for HDB resale price prediction',
	metadataBase: new URL('https://ee4802-g20-tool.pages.dev/'),
	alternates: {
		canonical: '/'
	}
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
