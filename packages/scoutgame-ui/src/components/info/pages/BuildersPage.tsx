import { Button, Typography } from '@mui/material';
import Link from 'next/link';

import { InfoCard } from '../../common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from '../../common/List';
import { InfoPageContainer } from '../components/InfoPageContainer';

export function BuildersPage() {
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
      <Typography>Join the Scout Game as a Developer and connect your GitHub account.</Typography>
      <Typography>
        Developers in the Scout Game gain recognition by actively contributing to approved projects. Each season lasts
        three months, and Developers earn Scout Gems weekly by completing specific tasks tied to their contributions. At
        the end of each week, Scout Gems are converted to Scout Points depending on the Developer's rank.
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        Key Developer Actions:
      </Typography>
      <div>
        <Typography>Collect Gems for completing qualified actions:</Typography>
        <List>
          <ListItem>Commit code to an approved open-source project</ListItem>
          <ListItem>Contribute to approved open-source projects with an accepted Pull Request</ListItem>
          <ListItem>Make your mark with a first-time code contribution to an approved project</ListItem>
          <ListItem>Hit a 3-Pull Request streak within 7 days</ListItem>
        </List>
      </div>
      <div>
        <Typography mb={1}>Approved Open-Source Project Owners</Typography>
        <Button variant='buy' LinkComponent={Link} href='/info/repositories' sx={{ px: 2 }}>
          View Repos
        </Button>
      </div>
    </InfoCard>
  );
}
