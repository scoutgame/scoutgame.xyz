import { Box } from '@mui/material';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from '../components/common/AppProviders';
import { Header } from '../components/common/Navigation/Header';
import { StickyFooter } from '../components/common/Navigation/StickyFooter';

import '@packages/scoutgame-ui/theme/styles.scss';

const appName = 'Scout Game Airdrop';

export const metadata: Metadata = {
  applicationName: appName,
  icons: {
    icon: ['/favicon.ico'],
    apple: ['/favicon.ico']
  },
  title: appName,
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: appName,
    images: 'https://scoutgame.xyz/images/manifest/scoutgame-logo-256.png',
    title: appName,
    description: 'Scout. Build. Win.'
  },
  twitter: {
    card: 'summary',
    title: appName,
    description: 'Scout. Build. Win.'
  }
};
export const viewport: Viewport = {
  themeColor: '#000',
  userScalable: false
};
export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='en' dir='ltr'>
      <body>
        {/* load env vars for the frontend - note that the parent body tag is required for React to not complain */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src='/__ENV.js' />
        <AppProviders>
          <Box
            display='grid'
            gridTemplateRows='auto 1fr auto'
            minHeight='100vh'
            bgcolor='background.default'
            height='100%'
          >
            <Header />
            <Box component='main' minHeight='100%' sx={{ display: 'flex', flexDirection: 'column' }}>
              {children}
            </Box>
            <StickyFooter />
          </Box>
        </AppProviders>
      </body>
    </html>
  );
}
