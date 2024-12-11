import {
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

import { InfoCard } from '../../common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from '../../common/List';
import { InfoPageContainer } from '../components/InfoPageContainer';

export function CeloPage() {
  return (
    <InfoPageContainer data-test='partner-celo-page' image='/images/info/rewards-partner-celo.jpg' title='Celo'>
      <Document />
    </InfoPageContainer>
  );
}

const tiers = [
  {
    name: 'Common',
    reward: '50 cUSD'
  },
  {
    name: 'Rare',
    reward: '150 cUSD'
  },
  {
    name: 'Epic',
    reward: '250 cUSD'
  },
  {
    name: 'Mythic',
    reward: '350 cUSD'
  },
  {
    name: 'Legendary',
    reward: '450 cUSD'
  }
];

function Document() {
  return (
    <InfoCard>
      <Typography>
        Celo is partnering with Scout Game to support builders who contribute to the ecosystem. Celo has a prize pool of
        5000 cUSD to distribute to talented Builders!
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        Ecosystem projects, that you can find in the list below (link list below), will mark their issues with a Tier in
        GitHub. The Tier determines the builder's reward offered by Celo for merging a PR that addresses the issue.
        Unmarked issues will default to the Common Tier.
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
        How to contribute
      </Typography>
      <Typography>
        Open Source contributions can be overwhelming when you are staring out. It is important to check a repository
        for a contribution guide. If they don't offer one, you can refer back to a general one or use the{' '}
        <Link href='https://docs.celo.org/general/ecosystem/contributors' target='_blank' rel='noreferrer'>
          Open Source Contribution guide
        </Link>{' '}
        provided by Celo
      </Typography>
      <Typography>Here some general steps to get started if you are new to open source contributions:</Typography>
      <List listStyleType='decimal'>
        <ListItem>
          Understand the repositories architecture and functions (e.g., if a repo is about EIP make sure you understand
          the structure of EIPs)
        </ListItem>
        <ListItem>Check the reported issue and make sure you understand what is asked of you</ListItem>
        <ListItem>
          Create a fork of the repository and clone your fork to your local machine. You need to for the repository, as
          you won't have direct write access to the main repository
        </ListItem>
        <ListItem>Run the code and reproduce the same behaviour</ListItem>
        <ListItem>
          Clarify all open questions from the issue. Make sure you dive deep into the repo before asking questions but
          also don’t waste time getting lost. Most of the time, when formulating a question, everything will become
          clear.
        </ListItem>
        <ListItem>If the coding language is unfamiliar to you, do a simple introduction course</ListItem>
        <ListItem>
          Maybe try test first approach, where you write the test first to make sure to check for the error that occurs
        </ListItem>
        <ListItem>Implement your solution</ListItem>
        <ListItem>Write tests if you haven't done it yet</ListItem>
        <ListItem>Write documentation (based on how documentation is done in that repository)</ListItem>
        <ListItem>Create a PR mentioning the Issue and explaining the solution</ListItem>
      </List>
      <Typography variant='h6' color='secondary' mt={2}>
        Qualified Celo Projects:
      </Typography>
      <List>
        <ListItem>
          <Link href='https://github.com/celo-org/faucet' target='_blank' rel='noreferrer'>
            https://github.com/celo-org/faucet
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/mento-protocol/celo-composer' target='_blank' rel='noreferrer'>
            https://github.com/mento-protocol/celo-composer
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/mento-protocol/mento-web' target='_blank' rel='noreferrer'>
            https://github.com/mento-protocol/mento-web
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/mento-protocol/reserve-site' target='_blank' rel='noreferrer'>
            https://github.com/mento-protocol/reserve-site
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/mento-protocol/mento-sdk' target='_blank' rel='noreferrer'>
            https://github.com/mento-protocol/mento-sdk
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/valora-inc/hooks' target='_blank' rel='noreferrer'>
            https://github.com/valora-inc/hooks
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/GoodDollar/GoodWeb3-Mono' target='_blank' rel='noreferrer'>
            https://github.com/GoodDollar/GoodWeb3-Mono
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/GoodDollar/GoodCollective' target='_blank' rel='noreferrer'>
            https://github.com/GoodDollar/GoodCollective
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/Glo-Foundation/glo-wallet' target='_blank' rel='noreferrer'>
            https://github.com/Glo-Foundation/glo-wallet/issues
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/Ubeswap/ubeswap-interface-v3' target='_blank' rel='noreferrer'>
            https://github.com/Ubeswap/ubeswap-interface-v3
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/gitcoinco/grants-stack' target='_blank' rel='noreferrer'>
            https://github.com/gitcoinco/grants-stack
          </Link>
        </ListItem>
      </List>
    </InfoCard>
  );
}
