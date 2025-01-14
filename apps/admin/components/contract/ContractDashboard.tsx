import env from '@beam-australia/react-env';
import { Box, Container, Tab, Tabs } from '@mui/material';
import { WagmiProvider } from '@packages/scoutgame-ui/providers/WagmiProvider';
import { headers } from 'next/headers';
import Link from 'next/link';

import { ProtocolContract } from './ProtocolContract';
import { SeasonOne } from './SeasonOne';
import { StarterPack } from './StarterPack';

export function ContractDashboard({ currentTab = 'seasonOne' }: { currentTab?: string }) {
  return (
    <Container maxWidth='xl'>
      <Tabs value={currentTab}>
        <Tab
          component={Link}
          value='seasonOne'
          label='Season One'
          href={{
            query: { tab: 'seasonOne' }
          }}
        />
        <Tab
          component={Link}
          value='starterPack'
          label='Starter Pack'
          href={{
            query: { tab: 'starterPack' }
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
        {currentTab === 'seasonOne' && <SeasonOne />}
        {currentTab === 'starterPack' && <StarterPack />}
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
