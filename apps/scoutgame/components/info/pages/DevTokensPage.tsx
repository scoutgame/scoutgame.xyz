import { Typography } from '@mui/material';
import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function DevTokensPage() {
  return (
    <InfoPageContainer data-test='dev-tokens-page' image='/images/info/info_banner.png' title='DEV Tokens'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>Scouts and Developers are rewarded in-game with DEV Tokens.</Typography>
      <Typography>
        DEV Tokens are claimable at the end of each week and remain claimable for only the current season and the next
        season.
      </Typography>
    </InfoCard>
  );
}
