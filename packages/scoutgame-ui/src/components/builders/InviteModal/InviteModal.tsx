import { Button, Divider, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { Dialog } from '../../common/Dialog';
import { JoinGithubButton } from '../../common/JoinGithubButton';

export function InviteModal({ open, onClose, signedIn }: { open: boolean; onClose: () => void; signedIn: boolean }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <Stack
        gap={{
          xs: 1,
          md: 2
        }}
        m={{
          xs: 1,
          md: 2
        }}
      >
        <Typography variant='h6' color='secondary' textAlign='center'>
          Be a Scout Game Builder
        </Typography>

        <Stack>
          <Typography fontWeight={500} mb={1} color='secondary'>
            How it Works
          </Typography>
          <List
            sx={{
              listStyleType: 'decimal',
              pl: 2,
              '& .MuiListItem-root': { py: 0.25, px: 0.5, display: 'list-item' }
            }}
          >
            <ListItem>
              <ListItemText primary='Scout Game creates Builder Cards to represent participating developers.' />
            </ListItem>
            <ListItem>
              <ListItemText primary='Builders compete in weekly contests by contributing to approved open source onchain projects.' />
            </ListItem>
            <ListItem>
              <ListItemText primary='Scouts show their support by purchasing Builder Cards. Builders and Scouts earn rewards based on the results of the weekly contest.' />
            </ListItem>
            <ListItem>
              <ListItemText primary='Builders and Scouts earn rewards based on the results of the weekly contest.' />
            </ListItem>
          </List>
        </Stack>

        <Stack>
          <Typography fontWeight={500} mb={1} color='secondary'>
            Builder Benefits
          </Typography>
          <List
            sx={{
              listStyleType: 'decimal',
              pl: 2,
              '& .MuiListItem-root': { py: 0.25, px: 0.5, display: 'list-item' }
            }}
          >
            <ListItem>
              <ListItemText primary='Receive a share of your Builder Card sales' />
            </ListItem>
            <ListItem>
              <ListItemText primary='Earn Scout Points for contributing to approved projects' />
            </ListItem>
            <ListItem>
              <ListItemText primary='Earn partner rewards from friendly ecosystems like Optimism' />
            </ListItem>
          </List>
        </Stack>
        <Divider sx={{ backgroundColor: 'secondary.main', width: '50%', mx: 'auto' }} />
        <Image src='/images/github-logo.png' width={120} height={30} alt='github' style={{ margin: '10px auto' }} />
        <Typography>
          {signedIn
            ? "Apply to be a Developer by connecting your GitHub. You'll be in the game once you make your first qualified contribution."
            : 'Sign up / Sign in to apply.'}
        </Typography>
        {signedIn ? (
          <JoinGithubButton text='Apply' />
        ) : (
          <Button
            variant='contained'
            color='primary'
            href={`/login?redirectUrl=${encodeURIComponent('/builders?modal=newBuilder')}`}
          >
            Sign in
          </Button>
        )}
      </Stack>
    </Dialog>
  );
}
