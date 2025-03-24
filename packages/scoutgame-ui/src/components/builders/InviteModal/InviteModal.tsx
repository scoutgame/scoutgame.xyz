import { Button, Stack, Typography } from '@mui/material';
import { builderLoginUrl } from '@packages/scoutgame/constants';
import Image from 'next/image';
import { Suspense } from 'react';

import { useUser } from '../../../providers/UserProvider';
import { Dialog } from '../../common/Dialog';
import { JoinGithubButton } from '../../common/JoinGithubButton';

export function InviteModal({ open, onClose, signedIn }: { open: boolean; onClose: () => void; signedIn: boolean }) {
  const { user } = useUser();
  const isBuilder = !!user?.builderStatus;
  const hasPrimaryWallet = !!user?.primaryWallet;

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs'>
      <Stack
        alignItems='center'
        gap={{
          xs: 1,
          md: 2
        }}
        m={{
          xs: 1,
          md: 2
        }}
        sx={{ '& a': { width: 'auto', px: 4 } }}
      >
        <Typography variant='h6' color='secondary' textAlign='center'>
          Be a Scout Game Developer
        </Typography>
        <Image src='/images/github-logo.png' width={120} height={30} alt='github' style={{ margin: '10px auto' }} />
        <Typography mb={1}>
          Apply to be a Developer by connecting your GitHub. You'll be in the game once you make your first qualified
          contribution.
        </Typography>
        {signedIn ? (
          <Suspense>
            <JoinGithubButton text='Apply' />
          </Suspense>
        ) : (
          <Button variant='contained' color='primary' href={builderLoginUrl}>
            Sign in to apply
          </Button>
        )}
      </Stack>
    </Dialog>
  );
}
