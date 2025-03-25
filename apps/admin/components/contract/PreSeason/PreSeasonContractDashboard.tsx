import { Box, Container, Tab, Tabs } from '@mui/material';
import Link from 'next/link';

import { PreSeasonNFT } from './PreSeasonNFT';
import { StarterNFT } from './StarterNFT';

export function PreSeasonContractDashboard({
  currentTab = 'preseason01',
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
          value={`preseason${preseasonNumber}`}
          label={`PreSeason ${preseasonNumber} Builder NFT`}
          href={{
            query: {
              tab: `preseason${preseasonNumber}`
            }
          }}
        />
        <Tab
          component={Link}
          value={`preseason${preseasonNumber}-starter`}
          label={`PreSeason ${preseasonNumber} Starter Cards`}
          href={{
            query: { tab: `preseason${preseasonNumber}-starter` }
          }}
        />
      </Tabs>
      <Box mt={2}>
        {currentTab === `preseason${preseasonNumber}` && <PreSeasonNFT season={season} />}
        {currentTab === `preseason${preseasonNumber}-starter` && <StarterNFT season={season} />}
      </Box>
    </Container>
  );
}
