import { Link, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from '@packages/scoutgame-ui/components/common/List';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function GoodDollarPage() {
  return (
    <InfoPageContainer
      data-test='partner-page-good-dollar'
      image='/images/info/rewards-partner-good-dollar.png'
      title='GoodDollar'
    >
      <Document />
    </InfoPageContainer>
  );
}

const tiers = [
  {
    name: 'Common',
    reward: '$50 | 500,000 G$'
  },
  {
    name: 'Rare',
    reward: '$150 | 1,500,000 G$'
  },
  {
    name: 'Epic',
    reward: '$250 | 2,500,000 G$'
  },
  {
    name: 'Mythic',
    reward: '$350 | 3,500,000 G$'
  },
  {
    name: 'Legendary',
    reward: '$450 | 4,500,000 G$'
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
      <Typography variant='h6' color='secondary' mt={2}>
        🌍 About GoodDollar
      </Typography>
      <Typography>
        GoodDollar is a nonprofit protocol designed to create and distribute Universal Basic Income (UBI) through the G$
        token. By leveraging blockchain technology, our mission is to expand decentralized financial education and
        access for all.
      </Typography>
      <Typography mt={1}>
        GoodDollar distributes crypto UBI (G$) daily, providing individuals worldwide with a gateway to financial access
        and inclusion. With nearly 1 million unique users and over 50,000 monthly active participants, GoodDollar is one
        of the fastest-growing projects in the Celo ecosystem.
      </Typography>

      <Typography variant='h6' color='secondary' mt={2}>
        🚀 Partner Rewards Program with Scout Game
      </Typography>
      <Typography>
        We've partnered with Scout Game to reward developers contributing to our open-source projects. By participating,
        developers can earn rewards, gain recognition, and directly support global economic empowerment.
      </Typography>

      <Typography variant='h6' color='secondary' mt={2}>
        ✅ How to Participate
      </Typography>
      <List>
        <ListItem>
          <Typography>Pick a ticket on the issues board labeled 'ScoutGame'</Typography>
        </ListItem>
        <ListItem>
          <Typography>Open a Pull Request (PR) to address an existing issue or improvement.</Typography>
        </ListItem>
        <ListItem>
          <Typography>Link to the issue you solved in the PR or as a comment.</Typography>
        </ListItem>
        <ListItem>
          <Typography>Your PR must be reviewed and merged by the GoodDollar team.</Typography>
        </ListItem>
      </List>
      <Typography mt={1}>
        Every Monday at UTC midnight the G$ Rewards you earned will be available via the Scout Game Claim page.
      </Typography>

      <Typography variant='h6' color='secondary' mt={2}>
        🎯 Rewards Eligibility and Process
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
        Eligible GoodDollar Repositories:
      </Typography>
      <Typography>Contribute to one or more of these repositories:</Typography>
      <List>
        {[
          'https://github.com/GoodDollar/GoodWeb3-Mono',
          'https://github.com/GoodDollar/GoodSdks',
          'https://github.com/GoodDollar/GoodCollective',
          'https://github.com/GoodDollar/GoodProtocolUI'
        ].map((repo) => (
          <ListItem key={repo}>
            <Link href={repo} target='_blank' rel='noreferrer'>
              {repo}
            </Link>
          </ListItem>
        ))}
      </List>

      <Typography variant='h6' color='secondary' mt={2}>
        📌 Get Started Today
      </Typography>
      <Typography>
        Find tickets labeled 'scoutgame' in one of the eligible repositories:{' '}
        <Link href='https://github.com/GoodDollar' target='_blank' rel='noreferrer'>
          https://github.com/GoodDollar
        </Link>
      </Typography>

      <Typography variant='h6' color='secondary' mt={2}>
        Take Your Contribution to the Next Level!
      </Typography>
      <Typography>
        Do you have an idea you'd love to see built? The GoodBuilders Program empowers you to turn your vision into
        reality! Go beyond taking tickets—bring your ideas to life and help shape the future of GoodDollar.
      </Typography>
      <Typography>
        🔍 Learn more & get involved:{' '}
        <Link href='https://ubi.gd/GoodBuilders' target='_blank' rel='noreferrer'>
          ubi.gd/GoodBuilders
        </Link>
      </Typography>

      <Typography variant='h6' color='secondary' mt={2}>
        🌍 Join our vibrant community for updates & collaboration:
      </Typography>
      <List>
        <ListItem>
          <Typography>
            Learn more about the GoodBuilders Program:{' '}
            <Link href='https://ubi.gd/GoodBuilders' target='_blank' rel='noreferrer'>
              ubi.gd/GoodBuilders
            </Link>
          </Typography>
        </ListItem>
        <ListItem>
          <Typography>Connect with our vibrant community for updates:</Typography>
        </ListItem>
        <ListItem>
          <Link href='https://discord.gg/gooddollar' target='_blank' rel='noreferrer'>
            GoodDollar Discord
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://t.me/gooddollar' target='_blank' rel='noreferrer'>
            GoodDollar Telegram
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://twitter.com/gooddollarorg' target='_blank' rel='noreferrer'>
            GoodDollar's X (formerly Twitter)
          </Link>
        </ListItem>
      </List>

      <Typography mt={1}>Join us and contribute to building the future of financial freedom!</Typography>

      <Typography>
        GoodDollar docs:{' '}
        <Link href='https://docs.gooddollar.org' target='_blank' rel='noreferrer'>
          docs.gooddollar.org
        </Link>
      </Typography>

      <Typography variant='h6' color='secondary' mt={2}>
        Let's build a better, fairer economy together 🌐💙
      </Typography>
    </InfoCard>
  );
}
