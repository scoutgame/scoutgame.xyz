'use client';

import env from '@beam-australia/react-env';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import type { SessionUser } from '@packages/nextjs/session/interfaces';
import { PurchaseProvider } from '@packages/scoutgame-ui/providers/PurchaseProvider';
import { SnackbarProvider } from '@packages/scoutgame-ui/providers/SnackbarContext';
import { UserProvider } from '@packages/scoutgame-ui/providers/UserProvider';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import theme from '../theme/theme';

import { LinkInterceptor } from './LinkInterceptor';
import { SWRProvider } from './SwrProvider';
import { WagmiProvider } from './WagmiProvider';

// This is required to provider the MUI theme otherwise the defaultProps are not applied
export function AppProviders({
  children,
  cookieValue,
  user
}: {
  children: ReactNode;
  cookieValue?: string;
  user: SessionUser | null;
}) {
  return (
    <WagmiProvider
      cookie={cookieValue}
      walletConnectProjectId={env('REACT_APP_WALLETCONNECT_PROJECTID') || process.env.REACT_APP_WALLETCONNECT_PROJECTID}
    >
      <AppRouterCacheProvider options={{ key: 'css' }}>
        <ThemeProvider theme={theme}>
          <CssBaseline enableColorScheme />
          <SWRProvider>
            <LinkInterceptor />
            <Toaster theme='dark' richColors />
            <UserProvider userSession={user}>
              <SnackbarProvider>
                <PurchaseProvider>{children}</PurchaseProvider>
              </SnackbarProvider>
            </UserProvider>
          </SWRProvider>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </WagmiProvider>
  );
}
