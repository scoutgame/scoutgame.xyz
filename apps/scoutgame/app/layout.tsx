import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import type { ReactNode } from 'react';

import { NotificationRequest } from 'components/common/NotificationRequest';
import { AppProviders } from 'components/layout/AppProviders';
import { getUserFromSession } from 'lib/session/getUserFromSession';
import 'theme/styles.scss';

const ClientGlobals = dynamic(() => import('components/common/ClientGlobals').then((comp) => comp.ClientGlobals), {
  ssr: false
});

const appName = 'Scout Game';
const appTitle = 'Scout. Build. Win.';
const appTitleTemplate = '%s - Scout Game';
const appDescription = 'Onchain network for connecting web3 developers, projects, organizations';

export const metadata: Metadata = {
  applicationName: appName,
  icons: {
    icon: ['/favicon.ico'],
    apple: ['/favicon.ico']
  },
  title: {
    default: `${appName} - ${appTitle}`,
    template: appTitleTemplate
  },
  description: appDescription,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: appTitle
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: appName,
    images: 'https://scoutgame.xyz/images/manifest/scoutgame-logo-256.png',
    title: {
      default: appTitle,
      template: appTitleTemplate
    },
    description: appDescription
  },
  twitter: {
    card: 'summary',
    title: {
      default: appTitle,
      template: appTitleTemplate
    },
    description: appDescription
  }
};
export const viewport: Viewport = {
  themeColor: '#fff',
  userScalable: false
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getUserFromSession();
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  return (
    <html lang='en' dir='ltr' suppressHydrationWarning>
      <body>
        {/* load env vars for the frontend - note that the parent body tag is required for React to not complain */}
        <Script src='/__ENV.js' />
        <AppProviders>
          <ClientGlobals userId={user?.id} />
          {user?.id && <NotificationRequest vapidPublicKey={vapidPublicKey} />}
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
