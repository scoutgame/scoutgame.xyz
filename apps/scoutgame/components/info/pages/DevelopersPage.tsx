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
  <Typography mb={1}> {/* Added mb=1 for spacing consistency */}
    Join the Scout Game as a Developer by connecting your GitHub account.
  </Typography>
  <Typography mb={1}> {/* Added mb=1 */}
    Developers gain recognition and earn Gems by contributing to approved open-source projects <Strong>and through onchain activity</Strong>. Each season lasts three months, and Developers receive weekly rewards based on their contributions. At the end of each week, Gems are converted into Scout Points, with higher-ranked Developers earning more points per gem.
  </Typography>
  <Typography variant='h6' color='secondary' mt={2} mb={1}> {/* Added mb=1 */}
    How to Earn Gems
  </Typography>
  <div>
    <Typography mb={1}>Developers earn Gems for specific contribution milestones:</Typography>
    <List sx={{ listStyleType: 'disc', pl: 2 }}> {/* Added sx for bullet style */}
      <ListItem sx={{ display: 'list-item', flexDirection: 'column', alignItems: 'flex-start', p:0, mb: 1 }}> {/* Adjusted ListItem style */}
        <Typography component="div" mb={0.5}> {/* Use div, adjust spacing */}
          <Strong>Self-Reviewed Pull Request → 2 Gems:</Strong> Awarded for each successfully merged pull request without a peer review. Looking for someone to review your PR? Check out our <Link href='https://t.me/+J0dl4_uswBY2NTkx' target="_blank" rel="noopener noreferrer">Telegram Group</Link>.
        </Typography>
      </ListItem>
      <ListItem sx={{ display: 'list-item', flexDirection: 'column', alignItems: 'flex-start', p:0, mb: 1 }}> {/* Adjusted ListItem style */}
         <Typography component="div" mb={0.5}> {/* Use div, adjust spacing */}
           <Strong>Peer-Reviewed Pull Request → 10 Gems:</Strong> Awarded for each successfully merged pull request that has been reviewed and approved by another contributor.
         </Typography>
      </ListItem>
      <ListItem sx={{ display: 'list-item', flexDirection: 'column', alignItems: 'flex-start', p:0, mb: 1 }}> {/* Adjusted ListItem style */}
        <Typography component="div" mb={0.5}> {/* Use div, adjust spacing */}
          <Strong>Pull Request Streak Bonus → 30 Gems:</Strong> Earned when you merge 3 peer-reviewed pull requests within a 7-day period. The streak is based on the merge date, not the submission date.
        </Typography>
      </ListItem>
      <ListItem sx={{ display: 'list-item', flexDirection: 'column', alignItems: 'flex-start', p:0, mb: 1 }}> {/* Adjusted ListItem style */}
         <Typography component="div" mb={0.5}> {/* Use div, adjust spacing */}
           <Strong>New Contributor Bonus → 100 Gems:</Strong> Awarded for your first peer-reviewed pull request that gets merged into an approved open-source repository.
         </Typography>
      </ListItem>
       {/* --- NEW ONCHAIN GEMS SECTION --- */}
      <ListItem sx={{ display: 'list-item', flexDirection: 'column', alignItems: 'flex-start', p:0, mb: 1 }}> {/* Adjusted ListItem style */}
        <Typography component="div" mb={0.5}> {/* Use div, adjust spacing */}
            <Strong>Onchain Gems (via Active Smart Contracts) → Bonus Gems:</Strong> Earn bonus Gems based on the activity of smart contracts attached to your created Projects. To get started:
        </Typography>
        <List sx={{ listStyleType: 'circle', pl: 3, mt: 0.5 }}> {/* Nested list */}
          <ListItem sx={{ display: 'list-item', p: 0, mb: 0.5 }}>
            <Typography component="span"><Strong>Create Projects:</Strong> Click your avatar and navigate to "Projects" to create a new project.</Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item', p: 0, mb: 0.5 }}>
             <Typography component="span"><Strong>Add Multiple Developers:</Strong> Collaborate with team members by adding them to your Project.</Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item', p: 0, mb: 0.5 }}>
             <Typography component="span"><Strong>Attach Smart Contracts:</Strong> Link your project to relevant smart contracts.</Typography>
          </ListItem>
           <ListItem sx={{ display: 'list-item', p: 0, mb: 0.5 }}>
             <Typography component="span"><Strong>Active Smart Contracts = Bonus Gems:</Strong> When your attached smart contracts demonstrate ongoing activity (e.g., based on metrics like monthly active users), all developers associated with the Project will receive bonus Gems. This rewards teams for building and maintaining actively used onchain applications.</Typography>
           </ListItem>
        </List>
      </ListItem>
       {/* --- END NEW SECTION --- */}
    </List>
  </div>
  <div>
    <Typography variant='h6' color='secondary' mt={2} mb={1}> {/* Added mb=1 */}
      Getting Started
    </Typography>
     {/* --- UPDATED GETTING STARTED LIST --- */}
    <List sx={{ listStyleType: 'decimal', pl: 2 }}> {/* Use ordered list style */}
        <ListItem sx={{ display: 'list-item', p:0, mb: 0.5}}>
            <Typography component="span">Connect your GitHub account and join the Scout Game.</Typography>
        </ListItem>
         <ListItem sx={{ display: 'list-item', p:0, mb: 0.5}}>
            <Typography component="span">Start contributing to open-source projects from the approved project list.</Typography>
        </ListItem>
         <ListItem sx={{ display: 'list-item', p:0, mb: 0.5}}>
            <Typography component="span">Create Projects and attach smart contracts to earn bonus Onchain Gems.</Typography>
        </ListItem>
         <ListItem sx={{ display: 'list-item', p:0, mb: 0.5}}>
            <Typography component="span">Earn Scout Gems by completing milestones.</Typography>
        </ListItem>
        <ListItem sx={{ display: 'list-item', p:0, mb: 0.5}}>
             <Typography component="span">Watch your rank grow as your Gems convert to Scout Points weekly.</Typography>
        </ListItem>
    </List>
     {/* --- END UPDATED LIST --- */}
    <Typography mt={1} mb={1}> {/* Added mt=1 */}
        Start building, get recognized, and climb the ranks! 🚀
    </Typography>
  </div>
  <div>
     {/* Keep existing Approved Projects section */}
    <Typography variant='h6' color='secondary' mt={2} mb={1}> {/* Added heading style consistency */}
        Approved Open-Source Projects
    </Typography>
    <Button variant='contained' LinkComponent={Link} href='/info/repositories' sx={{ px: 2 }}> {/* Assuming contained variant is similar to 'buy' */}
      View Repos
    </Button>
  </div>
</InfoCard>
  );
}
