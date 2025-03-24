import { Button, Stack, Typography } from '@mui/material';
import { builderLoginUrl } from '@packages/scoutgame/constants';
import Image from 'next/image';
import { Suspense } from 'react';

import { useUser } from '../../../providers/UserProvider';
import { Dialog } from '../../common/Dialog';
import { JoinGithubButton } from '../../common/JoinGithubButton';
import { WalletConnect } from '../BuilderInviteCard/WalletConnect';

export function InviteModal({ open, onClose, signedIn }: { open: boolean; onClose: () => void; signedIn: boolean }) {
  const { user } = useUser();
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
        <Image
          src={hasPrimaryWallet ? '/images/github-logo.png' : '/images/crypto/metamask.png'}
          width={hasPrimaryWallet ? 120 : 50}
          height={hasPrimaryWallet ? 30 : 50}
          alt='github'
          style={{ margin: '10px auto' }}
        />
        <Typography mb={1}>
          {!hasPrimaryWallet
            ? 'Connect your primary wallet to earn rewards for your github contributions.'
            : "Apply to be a Developer by connecting your GitHub. You'll be in the game once you make your first qualified contribution."}
        </Typography>
        {signedIn ? (
          <Suspense>
            {hasPrimaryWallet ? <JoinGithubButton text='Apply' /> : <WalletConnect onSuccess={onClose} />}
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
