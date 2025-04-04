import { Link, Typography } from '@mui/material';
import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from '@packages/scoutgame-ui/components/common/List';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function Game7Page() {
  return (
    <InfoPageContainer data-test='partner-game7-page' image='/images/info/rewards-partner-game7.png' title='Game7'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>
        Game7 is partnering with Scout Game to support developers who contribute to the ecosystem. Game7 will distribute
        20 rewards of $250 each, from a prize pool of $5000 USD, to Developers!
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        External developers will be rewarded $250 for merging a PR that addresses an Issue in one of the following
        GitHub Repos:
      </Typography>
      <List>
        <ListItem>
          <Link href='https://github.com/G7DAO/protocol' target='_blank' rel='noreferrer'>
            https://github.com/G7DAO/protocol
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/G7DAO/safes' target='_blank' rel='noreferrer'>
            https://github.com/G7DAO/safes
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/G7DAO/seer' target='_blank' rel='noreferrer'>
            https://github.com/G7DAO/seer
          </Link>
        </ListItem>
      </List>
    </InfoCard>
  );
}
