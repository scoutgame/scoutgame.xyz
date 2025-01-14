import env from '@beam-australia/react-env';
import { Box, Container, Tab, Tabs } from '@mui/material';
import { WagmiProvider } from '@packages/scoutgame-ui/providers/WagmiProvider';
import { headers } from 'next/headers';
import Link from 'next/link';

import { PreSeasonContractDashboard } from './PreSeason/PreSeasonContractDashboard';
import { ProtocolContract } from './ProtocolContract';

export function ContractDashboard({ currentTab = 'preseason1' }: { currentTab?: string }) {
  return (
    <Container maxWidth='xl'>
      <Tabs value={currentTab}>
        <Tab
          component={Link}
          value='preseason'
          label='PreSeason 01'
          href={{
            query: { tab: 'preseason1' }
          }}
        />
        <Tab
          component={Link}
          value='preseason1-starter'
          label='PreSeason 02'
          href={{
            query: { tab: 'preseason2' }
          }}
        />

        <Tab
          component={Link}
          value='protocol'
          label='Protocol (Testnet)'
          href={{
            query: { tab: 'protocol' }
          }}
        />
      </Tabs>
      <Box mt={2}>
        {currentTab === 'preseason1-builder' && (
          <PreSeasonContractDashboard preseasonNumber='01' currentTab={currentTab} season='2024-W41' />
        )}
        {currentTab === 'preseason1-builder' && (
          <PreSeasonContractDashboard preseasonNumber='02' currentTab={currentTab} season='2025-W02' />
        )}

        {currentTab === 'protocol' && (
          <WagmiProvider
            walletConnectProjectId={env('WALLET_CONNECT_PROJECTID')}
            cookie={headers().get('cookie') ?? ''}
          >
            <ProtocolContract />
          </WagmiProvider>
        )}
      </Box>
    </Container>
  );
}
