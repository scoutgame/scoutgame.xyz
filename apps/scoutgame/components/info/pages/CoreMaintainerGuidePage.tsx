import {
  ListItemText,
  List,
  ListItem,
  Typography,
  Link,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function CoreMaintainerGuidePage() {
  return (
    <InfoPageContainer
      data-test='core-maintainer-guide-page'
      image='/images/info/info_banner.png'
      title='Core Maintainer Guide'
    >
      <Document />
    </InfoPageContainer>
  );
}

function CustomList({ children, listStyleType }: { children: React.ReactNode; listStyleType: 'decimal' | 'disc' }) {
  return (
    <List
      sx={{
        listStyleType,
        pl: 2,
        pt: 0,
        '& .MuiListItem-root': { py: 0.25, px: 0.5, display: 'list-item' },
        '& .MuiListItemText-primary': { fontWeight: 500, fontSize: '1.15rem' },
        '& .MuiListItemText-secondary': { color: 'text.primary', fontSize: '1rem', lineHeight: '1.75rem', my: 0.5 }
      }}
    >
      {children}
    </List>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography variant='h6' color='secondary'>
        Preparing your Project for Scout Game
      </Typography>
      <Typography>
        No actions are required for a new project to participate in Scout Game. However, to provide the best experience
        for developers and encourage quality contributions, here are the best practices you may follow to prepare for
        Scout Game.
      </Typography>
      <Typography variant='h5' color='secondary' mt={2} id='leveling-up-your-first-issue'>
        Using GitHub Issues
      </Typography>
      <Typography>
        Using issues is a good way to let developers know how they can best contribute to your project. Here are some
        best practices for managing your project's GitHub issues
      </Typography>
      <CustomList listStyleType='decimal'>
        <ListItem>
          <ListItemText
            primary='Use Labels'
            secondary={
              <>
                Labeling your issues is a great way to steer developers in the right direction and keep them away from
                areas you don't want to be touched. Here are a few examples that Scout Game Developers will be looking
                for:
                <br />
                🚀 Scout Game
                <br />
                🏷️ good first issue
                <br />
                🙋‍♂️ help wanted
              </>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary='Provide at least 3 good first issues in your repositories.'
            secondary='Good first issues help onboard developers to your project so they can make more complex contributions in the future. Some examples of good first issues include adding documentation, addressing trivial bugs, and building small features.'
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary='Implement Prize Tiers'
            secondary='Reward developers based on the complexity and scope of the issues they tackle using prize tiers. Here is
                the suggested (not required) prize tier structure with issue labels and possible reward amounts:'
          />
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Tier Label</TableCell>
                <TableCell align='center'>Suggested Prize</TableCell>
                <TableCell align='right'>Effort</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Scout Game - Common</TableCell>
                <TableCell align='center'>50 cUSD</TableCell>
                <TableCell align='right'>(less than 2 hours)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Scout Game - Rare</TableCell>
                <TableCell align='center'>150 cUSD</TableCell>
                <TableCell align='right'>(1 day of work)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Scout Game - Epic</TableCell>
                <TableCell align='center'>250 cUSD</TableCell>
                <TableCell align='right'>(&gt;1 day of work)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ListItem>
      </CustomList>
      <Typography variant='h6' color='secondary' mt={2}>
        Interacting with Developers in GitHub
      </Typography>
      <Typography>
        Monitor the project's GitHub repositories to answer any questions that might pop up. Feel free to give builders
        feedback on best practices as well, e.g., documentation and getting an issue assigned. They are there to learn.
        It's good practice to reply within 24 - 48 hours. If you are not responsive, builders won't come back to
        contribute.
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        Attracting Developers
      </Typography>
      <Typography>
        Scout Game will build a dedicated landing page for your project. You can share the link on socials to promote
        your program. Make sure to tag Scout Game so that we can amplify your posts!
      </Typography>
      <Typography>
        Farcaster: <Link href='https://warpcast.com/scoutgamexyz'>@scoutgamexyz</Link>
      </Typography>
      <Typography>
        Twitter: <Link href='https://x.com/scoutgamexyz'>@scoutgamexyz</Link>
      </Typography>
      <Typography>You may also join our Telegram channel to promote your project.</Typography>
      <Link href='https://t.me/+1Z7oPrdakjFkM2M5'>https://t.me/+1Z7oPrdakjFkM2M5</Link>
    </InfoCard>
  );
}
