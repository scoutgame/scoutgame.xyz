import { Card, CardContent, CardMedia, Grid, Typography } from '@mui/material';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { SocialIcons } from 'components/profile/components/UserDetails/SocialIcons';
import type { Social } from 'components/profile/interfaces';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

export default function MemberDirectoryPage () {
  const [currentSpace] = useCurrentSpace();
  const { data: workspaceMembers } = useSWR(currentSpace ? `${currentSpace.id}/members` : null, () => currentSpace ? charmClient.members.getWorkspaceMembers(currentSpace.id) : null);

  return (
    <CenteredPageContent>
      <Typography variant='h1'>Member Directory</Typography>

      <Grid container>
        {
          workspaceMembers?.map(workspaceMember => {
            const profilePic = workspaceMember.properties.find(property => property.type === 'profile_pic');
            return (
              <Grid item xs={4}>
                <Card sx={{ maxWidth: 345 }}>
                  <CardMedia
                    component='img'
                    height={150}
                    image={profilePic?.value as string ?? ''}
                    alt='Profile pic'
                  />
                  <CardContent>
                    <Typography gutterBottom variant='h6' component='div'>
                      {workspaceMember.username}
                    </Typography>
                    <SocialIcons
                      sx={{
                        gap: 1,
                        my: 1
                      }}
                      social={workspaceMember.profile?.social as Social}
                    />
                    <Typography variant='body2' fontWeight={500}>About Me</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {workspaceMember.profile?.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        }
      </Grid>
    </CenteredPageContent>
  );
}
