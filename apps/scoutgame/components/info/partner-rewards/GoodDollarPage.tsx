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
      <Typography fontWeight='bold'>Submit Your Contribution:</Typography>
      <List>
        <ListItem>
          <Typography>Pick a ticket on the issues board labeled 'ScoutGame'</Typography>
        </ListItem>
        <ListItem>
          <Typography>Open a Pull Request (PR) to address an existing issue or improvement.</Typography>
        </ListItem>
        <ListItem>
          <Typography>Your PR must be reviewed and merged by the GoodDollar team.</Typography>
        </ListItem>
      </List>
      <Typography>
        Applying for the QF Round can be done{' '}
        <Link href='https://explorer.gitcoin.co/#/round/42220/29' target='_blank' rel='noreferrer'>
          here
        </Link>
        !
      </Typography>
      <Typography mt={1}>
        GoodDollar will also reach out via email or through telegram/discord to eligible contributors, guiding them on
        how to register for the QF round.
      </Typography>
      <Typography mt={1}>
        At the end of the QF round, participants receive their guaranteed rewards, additional donations, and matching
        funds.
      </Typography>

      <Typography variant='h6' color='secondary' mt={2}>
        🎯 Rewards Eligibility and Process
      </Typography>
      <Typography fontWeight='bold'>Guaranteed Rewards:</Typography>
      <Typography>
        (The rewards will be distributed in G$ s based on the token price at the time of distribution.)
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
      <Typography mt={1}>
        All developers with merged PRs will receive guaranteed rewards donated directly to their project during the
        upcoming Gitcoin Grants Quadratic Funding (QF) round.
      </Typography>
      <Typography fontWeight='bold' mt={1}>
        Additional QF Benefits:
      </Typography>
      <List>
        <ListItem>
          <Typography>Participants may earn extra donations from the broader community.</Typography>
        </ListItem>
        <ListItem>
          <Typography>
            Contributions from the GoodDollar community will unlock additional matching funds, amplifying rewards.
          </Typography>
        </ListItem>
      </List>

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
        📅 Important Dates
      </Typography>
      <Typography fontWeight='bold'>Next Gitcoin QF Round (GG23)</Typography>
      <Typography fontWeight='bold' mt={1}>
        Applications Open:
      </Typography>
      <Typography>March 17th - April 1st</Typography>
      <Typography fontWeight='bold' mt={1}>
        Extended Applications open:
      </Typography>
      <Typography>April 2nd - April 7th</Typography>
      <Typography fontWeight='bold' mt={1}>
        Donations and Matching Round:
      </Typography>
      <Typography>April 2nd - April 16th</Typography>

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
          <Link href='https://t.me/GoodDollarX' target='_blank' rel='noreferrer'>
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
      <Typography mt={1}>
        Read more about GoodDollar's Gitcoin Grants{' '}
        <Link href='https://ubi.gd/KickoffQFRound' target='_blank' rel='noreferrer'>
          here
        </Link>
      </Typography>
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
