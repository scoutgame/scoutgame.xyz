import { Box, Container, Tab, Tabs } from '@mui/material';
import Link from 'next/link';

import { PreSeasonNFT } from './PreSeasonNFT';
import { StarterPack } from './StarterPack';

export function PreSeasonContractDashboard({
  currentTab = 'seasonOne',
  preseasonNumber,
  season
}: {
  currentTab?: string;
  preseasonNumber: string;
  season: string;
}) {
  return (
    <Container maxWidth='xl'>
      <Tabs value={currentTab}>
        <Tab
          component={Link}
          value='preseason1-builder'
          label={`PreSeason ${preseasonNumber} Builder NFT`}
          href={{
            query: { tab: `preseason${preseasonNumber}-builder` }
          }}
        />
        <Tab
          component={Link}
          value='preseason1-starter'
          label={`PreSeason ${preseasonNumber} Starter Pack`}
          href={{
            query: { tab: `preseason${preseasonNumber}-starter` }
          }}
        />
      </Tabs>
      <Box mt={2}>
        {currentTab === `preseason${preseasonNumber}-builder` && <PreSeasonNFT season={season} />}
        {currentTab === `preseason${preseasonNumber}-starter` && <StarterPack season={season} />}
      </Box>
    </Container>
  );
}
