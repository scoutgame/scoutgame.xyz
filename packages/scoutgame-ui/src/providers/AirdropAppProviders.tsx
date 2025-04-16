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

import { SWRProvider } from './SwrProvider';
import { WagmiProvider } from './WagmiProvider';

// This is required to provider the MUI theme otherwise the defaultProps are not applied
export function AirdropAppProviders({ children }: { children: ReactNode }) {
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
              <Toaster theme='dark' richColors />
              <SnackbarProvider>{children}</SnackbarProvider>
            </SWRProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </WagmiProvider>
    </ViewTransitions>
  );
}
