import { Button, Typography } from '@mui/material';
import { InfoCard } from '@packages/scoutgame-ui/components/common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from '@packages/scoutgame-ui/components/common/List';
import Link from 'next/link';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function DevelopersPage() {
  return (
    <InfoPageContainer
      data-test='builders-page'
      image='/images/info/info_banner.png'
      title='How it works for Developers'
    >
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>Join the Scout Game as a Developer by connecting your GitHub account.</Typography>
      <Typography>
        Developers gain recognition and earn Gems by contributing to approved open-source projects. Each season lasts
        three months, and Developers receive weekly rewards based on their contributions. At the end of each week, Gems
        are converted into Scout Points, with higher-ranked Developers earning more points per gem.
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How to Earn Gems
      </Typography>
      <div>
        <Typography mb={1}>Developers earn Gems for specific contribution milestones:</Typography>
        <List>
          <ListItem>
            <Typography mb={1}>Self-Reviewed Pull Request → 2 Gems</Typography>
            <Typography mb={1}>
              Awarded for each successfully merged pull request without a peer review. looking for someone to review
              your PR? Checkout our <Link href='https://t.me/+J0dl4_uswBY2NTkx'>Telegram Group</Link>.
            </Typography>
          </ListItem>
          <ListItem>
            <Typography mb={1}>Peer-Reviewed Pull Request → 10 Gems</Typography>
            <Typography mb={1}>
              Awarded for each successfully merged pull request that has been reviewed and approved by another
              contributor.
            </Typography>
          </ListItem>
          <ListItem>
            <Typography mb={1}>Pull Request Streak Bonus → 30 Gems</Typography>
            <Typography mb={1}>Earned when you merge 3 peer-reviewed pull requests within a 7-day period.</Typography>
            <Typography mb={1}>The streak is based on the merge date, not the submission date.</Typography>
          </ListItem>
          <ListItem>
            <Typography mb={1}>New Contributor Bonus → 100 Gems</Typography>
            <Typography mb={1}>
              Awarded for your first peer-reviewed pull request that gets merged into an approved open-source
              repository.
            </Typography>
          </ListItem>
        </List>
      </div>
      <div>
        <Typography variant='h6' color='secondary' mt={2}>
          Getting Started
        </Typography>
        <Typography mb={1}>1. Connect your GitHub account and join the Scout Game.</Typography>
        <Typography mb={1}>2. Start contributing to open-source projects from the approved project list.</Typography>
        <Typography mb={1}>3. Earn Scout Gems by completing milestones. </Typography>
        <Typography mb={1}>4. Watch your rank grow as your Gems convert to Scout Points weekly.</Typography>
        <Typography mb={1}>Start building, get recognized, and climb the ranks! 🚀</Typography>
      </div>
      <div>
        <Typography mb={1}>Approved Open-Source Projects</Typography>
        <Button variant='buy' LinkComponent={Link} href='/info/repositories' sx={{ px: 2 }}>
          View Repos
        </Button>
      </div>
    </InfoCard>
  );
}
