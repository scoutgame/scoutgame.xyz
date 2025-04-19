import 'server-only';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { SnackbarProvider } from '@packages/scoutgame-ui/providers/SnackbarContext';
import { SWRProvider } from '@packages/scoutgame-ui/providers/SwrProvider';
import { WagmiProvider } from '@packages/scoutgame-ui/providers/WagmiProvider';
import theme from '@packages/scoutgame-ui/theme/theme.ts';
import { headers } from 'next/headers';
import { ViewTransitions } from 'next-view-transitions';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import { ClientGlobals } from './ClientGlobals';

// This is required to provider the MUI theme otherwise the defaultProps are not applied
export function AppProviders({ children }: { children: ReactNode }) {
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
              <ClientGlobals />
              <SnackbarProvider>{children}</SnackbarProvider>
            </SWRProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </WagmiProvider>
    </ViewTransitions>
  );
}
