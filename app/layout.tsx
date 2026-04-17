import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App as AntdApp } from 'antd';

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
					<AntdApp>{children}</AntdApp>
				</AntdRegistry>
			</body>
		</html>
	);
}
