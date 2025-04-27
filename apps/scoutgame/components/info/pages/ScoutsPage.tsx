import { Typography } from '@mui/material';
import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from '@packages/scoutgame-ui/components/common/List';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function ScoutsPage() {
  return (
    <InfoPageContainer data-test='scouts-page' image='/images/info/info_banner.png' title='How it works for Scouts'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>Step into the shoes of an onchain Scout.</Typography>
      <Typography>
        Scouts participate by collecting NFTs associated with top developers during each season. As these developers
        excel—by contributing to codebases—Scouts accumulate DEV tokens. The more successful your chosen developers, the
        more DEV tokens you earn.
      </Typography>
      <Typography>
        By accumulating DEV tokens, you can exchange them to scout even more developers, boosting your standing within
        the game and increasing your potential rewards.
      </Typography>
      <div>
        <Typography variant='h6' color='secondary' mt={2}>
          Key Scout Actions:
        </Typography>
        <List>
          <ListItem>Collect NFTs from top developers every season.</ListItem>
          <ListItem>Earn DEV Tokens when the developers you back succeed in open-source contributions.</ListItem>
        </List>
      </div>
    </InfoCard>
  );
}
