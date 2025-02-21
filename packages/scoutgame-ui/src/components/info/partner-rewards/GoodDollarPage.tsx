import { Alert, Link, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

import { InfoCard } from '../../common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from '../../common/List';
import { InfoPageContainer } from '../components/InfoPageContainer';

export function GoodDollarPage() {
  return (
    <InfoPageContainer
      data-test='partner-page-good-dollar'
      image='/images/info/rewards-partner-good-dollar.jpg'
      title='Good Dollar'
    >
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

const qualifiedProjects = [
  'https://github.com/celo-org/faucet',
  'https://github.com/celo-org/celo-composer',
  'https://github.com/celo-org/composer-kit/issues',
  'https://github.com/celo-org/svelte-template',
  'https://github.com/celo-org/celo-composer-react-native',
  'https://github.com/celo-org/celo-composer-flutter',
  'https://github.com/celo-org/celo-farcaster-frames'
];
const previousProjects = [
  'https://github.com/valora-inc/hooks',
  'https://github.com/GoodDollar/GoodWeb3-Mono',
  'https://github.com/GoodDollar/GoodCollective',
  'https://github.com/Glo-Foundation/glo-wallet',
  'https://github.com/Ubeswap/ubeswap-interface-v3',
  'https://github.com/capsule-org/examples-hub/issues',
  'https://github.com/distroinfinity/superflow',
  'https://github.com/getpara/awesome-para'
];

function Document() {
  return (
    <InfoCard>
      <Typography>
        Celo is partnering with Scout Game to support developer who contribute to the ecosystem. Celo has a prize pool
        of 5000 cUSD to distribute to talented Developers!
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        Ecosystem projects, that you can find in the list below (link list below), will mark their issues with a Tier in
        GitHub. The Tier determines the developer's reward offered by Celo for merging a PR that addresses the issue.
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
      <Alert severity='info'>
        This is the chance for you to <strong>learn</strong> and <strong>grow</strong> and make connections. Make sure
        to <strong>reply</strong> to repo-maintainers, implement their feedback and communicate!!! If anything is
        unclear, ask! It is normal that a new repository can be overwhelming. So, communicate, communicate, communicate
        and learn!
      </Alert>
      <Typography>
        Here are some general <strong>steps to get started</strong> if you are new to open source contributions:
      </Typography>
      <List listStyleType='decimal'>
        <ListItem>
          Understand the repositories architecture and functions (e.g., if a repo is about EIP make sure you understand
          the structure of EIPs). <strong>Read some code</strong> (best way to learn)
        </ListItem>
        <ListItem>Check the reported issue and make sure you understand what is asked of you</ListItem>
        <ListItem>
          Create a <strong>fork</strong> of the repository and clone your fork to your local machine. You need to fork
          the repository, as you won't have direct write access to the main repository
        </ListItem>
        <ListItem>
          <strong>Run the code</strong> and reproduce the same behaviour
        </ListItem>
        <ListItem>
          <strong>Clarify</strong> all <strong>open questions</strong> from the issue. Make sure you dive deep into the
          repo before asking questions but also don’t waste time getting lost. Most of the time, when formulating a
          question, everything will become clear.
        </ListItem>
        <ListItem>If the coding language is unfamiliar to you, do a simple introduction course</ListItem>
        <ListItem>
          Optional: try test first approach, where you write the test first to make sure to check for the error that
          occurs
        </ListItem>
        <ListItem>Implement your solution</ListItem>
        <ListItem>
          Write <strong>tests</strong> if you haven't done it yet
        </ListItem>
        <ListItem>
          Write <strong>documentation</strong> (based on how documentation is done in that repository)
        </ListItem>
        <ListItem>
          Create a PR mentioning the Issue and explaining the solution, this will help the repo maintainer understand
          what you did and merge your PR quickly
        </ListItem>
        <ListItem>
          Implement any <strong>feedback</strong> the maintainer asks for
        </ListItem>
      </List>
      <Typography variant='h6' color='secondary' mt={2}>
        Qualified Celo Projects:
      </Typography>
      <List>
        {qualifiedProjects.map((project) => (
          <ListItem key={project}>
            <Link href={project} target='_blank' rel='noreferrer'>
              {project}
            </Link>
          </ListItem>
        ))}
      </List>
      <Typography variant='h6' color='secondary' mt={2}>
        No new bounties (for now):
      </Typography>
      <List>
        {previousProjects.map((project) => (
          <ListItem key={project}>
            <Link href={project} target='_blank' rel='noreferrer'>
              {project}
            </Link>
          </ListItem>
        ))}
      </List>
    </InfoCard>
  );
}
