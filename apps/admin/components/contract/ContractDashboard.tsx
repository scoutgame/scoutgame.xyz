import { Tabs, Tab, Box, Container } from '@mui/material';
import Link from 'next/link';

import { WagmiProvider } from 'components/providers/wagmi/WagmiProvider';
import type { BuilderNFTContractData } from 'lib/contract/getContractData';
import type { StarterPackNFTContractData } from 'lib/contract/getStarterPackContractData';

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
          <WagmiProvider>
            <ProtocolContract />
          </WagmiProvider>
        )}
      </Box>
    </Container>
  );
}
