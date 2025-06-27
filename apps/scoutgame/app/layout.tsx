import { getCachedUserFromSession as getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { AppProviders } from '@packages/scoutgame-ui/providers/AppProviders';
import { DraftProvider } from '@packages/scoutgame-ui/providers/DraftProvider';
import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { ModalProvider } from 'components/common/ModalProvider';

import '@packages/scoutgame-ui/theme/styles.scss';

const ClientGlobals = dynamic(() => import('../components/common/ClientGlobals').then((comp) => comp.ClientGlobals), {
  // for explanation for "!!", see https://github.com/PostHog/posthog/issues/26016
  ssr: !!false
});

const appName = 'Scout Game';
const appTitle = 'Scout. Build. Win.';
const appTitleTemplate = '%s - Scout Game';
const appDescription = 'Fantasy sports with onchain developers';

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
  const headersList = await headers();
  const cookieValue = headersList.get('cookie') ?? '';

  return (
    <html lang='en' dir='ltr' suppressHydrationWarning>
      <body>
        {/* load env vars for the frontend - note that the parent body tag is required for React to not complain */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src='/__ENV.js' />
        <AppProviders cookieValue={cookieValue} user={user}>
          <DraftProvider>
            <ModalProvider>
              <ClientGlobals userId={user?.id} />
              {/* {user?.id && <NotificationRequest vapidPublicKey={vapidPublicKey} />} */}
              {children}
            </ModalProvider>
          </DraftProvider>
        </AppProviders>
      </body>
    </html>
  );
}
