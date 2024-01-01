import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import StyledJsxRegistry from './registry';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Prediction Tool',
	description: 'An app for HDB resale price prediction',
	metadataBase: new URL('https://ee4802-g20-tool.vercel.app/'),
	alternates: {
		canonical: '/'
	}
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<StyledJsxRegistry>{children}</StyledJsxRegistry>
			</body>
		</html>
	);
}
