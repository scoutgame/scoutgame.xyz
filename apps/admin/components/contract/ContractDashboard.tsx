import env from '@beam-australia/react-env';
import { Box, Container, Tab, Tabs } from '@mui/material';
import { WagmiProvider } from '@packages/scoutgame-ui/providers/WagmiProvider';
import { headers } from 'next/headers';
import Link from 'next/link';

import { PreSeasonContractDashboard } from './PreSeason/PreSeasonContractDashboard';
import { ProtocolContract } from './ProtocolContract';

interface ContractDashboardProps {
  currentTab?: string;
}

export async function ContractDashboard({ currentTab = 'preseason02' }: ContractDashboardProps) {
  const headersList = await headers();
  return (
    <Container maxWidth='xl'>
      {/* Outer-level tabs */}
      <Tabs
        value={
          currentTab.startsWith('preseason01')
            ? 'preseason01'
            : currentTab.startsWith('preseason02')
              ? 'preseason02'
              : currentTab
        }
      >
        <Tab component={Link} value='preseason01' label='PreSeason 01' href={{ query: { tab: 'preseason01' } }} />
        <Tab component={Link} value='preseason02' label='PreSeason 02' href={{ query: { tab: 'preseason02' } }} />
        <Tab component={Link} value='protocol' label='Protocol (Testnet)' href={{ query: { tab: 'protocol' } }} />
      </Tabs>

      <Box mt={2}>
        {/* Outer-level switch */}
        {currentTab.startsWith('preseason01') && (
          <PreSeasonContractDashboard currentTab={currentTab} preseasonNumber='01' season='2024-W41' />
        )}

        {currentTab.startsWith('preseason02') && (
          <PreSeasonContractDashboard currentTab={currentTab} preseasonNumber='02' season='2025-W02' />
        )}

        {currentTab === 'protocol' && (
          <WagmiProvider
            walletConnectProjectId={env('WALLET_CONNECT_PROJECTID')}
            cookie={headersList.get('cookie') ?? ''}
          >
            <ProtocolContract />
          </WagmiProvider>
        )}
      </Box>
    </Container>
  );
}
