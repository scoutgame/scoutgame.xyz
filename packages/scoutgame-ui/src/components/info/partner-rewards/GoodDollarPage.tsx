import { Link, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

import { InfoCard } from '../../common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from '../../common/List';
import { InfoPageContainer } from '../components/InfoPageContainer';

export function GoodDollarPage() {
  return (
    <InfoPageContainer
      data-test='partner-page-good-dollar'
      image='/images/info/rewards-partner-good-dollar.png'
      title='Good Dollar'
    >
      <Document />
    </InfoPageContainer>
  );
}

const tiers = [
  {
    name: 'Common',
    reward: '$50'
  },
  {
    name: 'Rare',
    reward: '$150'
  },
  {
    name: 'Epic',
    reward: '$250'
  },
  {
    name: 'Mythic',
    reward: '$350'
  },
  {
    name: 'Legendary',
    reward: '$450'
  }
];

const qualifiedProjects = [
  'https://github.com/GoodDollar/GoodWeb3-Mono',
  'https://github.com/GoodDollar/GoodSdks',
  'https://github.com/GoodDollar/GoodCollective',
  'https://github.com/GoodDollar/GoodProtocolUI'
];

function Document() {
  return (
    <InfoCard>
      <Typography>
        GoodDollar is collaborating with Scout Game to support developers contributing to the GoodDollar ecosystem.
        Talented developers can earn rewards for their open source contributions to GoodDollar’s repositories!
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        Developers who submit and merge Pull Requests (PRs) in eligible GoodDollar repositories will qualify for
        rewards. Those who qualify will be notified via email and must sign up for the Quadratic Funding (QF) round to
        receive their rewards. Donations and matching funds will be distributed at the end of the round.
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>GitHub Issue Tier</TableCell>
            <TableCell align='right'>Reward</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tiers.map((tier) => (
            <TableRow key={tier.name}>
              <TableCell>{tier.name}</TableCell>
              <TableCell align='right'>{tier.reward}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Typography variant='h6' color='secondary' mt={2}>
        Eligible GoodDollar Repositories
      </Typography>
      <Typography>Developers can contribute to the following repositories:</Typography>
      <List>
        {qualifiedProjects.map((repo) => (
          <ListItem key={repo}>
            <Link href={repo} target='_blank' rel='noreferrer'>
              {repo}
            </Link>
          </ListItem>
        ))}
      </List>
    </InfoCard>
  );
}
