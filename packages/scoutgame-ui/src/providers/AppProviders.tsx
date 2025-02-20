import 'server-only';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import type { SessionUser } from '@packages/nextjs/session/interfaces';
import { PurchaseProvider } from '@packages/scoutgame-ui/providers/PurchaseProvider';
import { SnackbarProvider } from '@packages/scoutgame-ui/providers/SnackbarContext';
import { UserProvider } from '@packages/scoutgame-ui/providers/UserProvider';
import { headers } from 'next/headers';
import { ViewTransitions } from 'next-view-transitions';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import theme from '../theme/theme';

import { DeveloperInfoModalProvider } from './DeveloperInfoModalProvider';
import { LinkInterceptor } from './LinkInterceptor';
import { ModalProvider } from './ModalProvider';
import { SWRProvider } from './SwrProvider';
import { WagmiProvider } from './WagmiProvider';

// This is required to provider the MUI theme otherwise the defaultProps are not applied
export function AppProviders({ children, user }: { children: ReactNode; user: SessionUser | null }) {
  return (
    <ViewTransitions>
      <WagmiProvider
        cookie={headers().get('cookie') ?? ''}
        walletConnectProjectId={process.env.REACT_APP_WALLETCONNECT_PROJECTID}
      >
        <AppRouterCacheProvider options={{ key: 'css' }}>
          <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            <SWRProvider>
              <LinkInterceptor />
              <Toaster theme='dark' richColors />
              <UserProvider userSession={user}>
                <SnackbarProvider>
                  <PurchaseProvider>
                    <ModalProvider>
                      <DeveloperInfoModalProvider>{children}</DeveloperInfoModalProvider>
                    </ModalProvider>
                  </PurchaseProvider>
                </SnackbarProvider>
              </UserProvider>
            </SWRProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </WagmiProvider>
    </ViewTransitions>
  );
}
