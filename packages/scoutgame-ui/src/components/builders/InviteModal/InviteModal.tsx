'use client';

import { Button, Stack, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { builderLoginUrl } from '@packages/scoutgame/constants';
import Image from 'next/image';
import { Suspense, useEffect, useState } from 'react';

import { useUser } from '../../../providers/UserProvider';
import { Dialog } from '../../common/Dialog';
import { JoinGithubButton } from '../../common/JoinGithubButton';
import { WalletConnect } from '../BuilderInviteCard/WalletConnect';

export function InviteModal({ open, onClose, signedIn }: { open: boolean; onClose: () => void; signedIn: boolean }) {
  const { user } = useUser();
  const hasPrimaryWallet = !!user?.primaryWallet;
  const isBuilder = !!user?.builderStatus;

  const [tab, setTab] = useState<'github' | 'wallet'>('github');

  useEffect(() => {
    if (isBuilder && !hasPrimaryWallet) {
      setTab('wallet');
    } else if (!isBuilder) {
      setTab('github');
    }
  }, [user, hasPrimaryWallet, isBuilder]);

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
          src={tab === 'github' ? '/images/github-logo.png' : '/images/crypto/metamask.png'}
          width={tab === 'github' ? 120 : 50}
          height={tab === 'github' ? 30 : 50}
          alt='github'
          style={{ margin: '10px auto' }}
        />
        <Typography mb={1}>
          {tab === 'wallet'
            ? 'Connect your primary wallet to earn rewards for your github contributions and onchain activities.'
            : "Apply to be a Developer by connecting your GitHub. You'll be in the game once you make your first qualified contribution."}
        </Typography>
        {signedIn ? (
          <Suspense>
            {tab === 'github' ? (
              <JoinGithubButton text='Apply' connected={isBuilder} />
            ) : (
              <WalletConnect
                onSuccess={() => {
                  if (isBuilder) {
                    onClose();
                  }
                }}
                connected={hasPrimaryWallet}
              />
            )}
          </Suspense>
        ) : (
          <Button variant='contained' color='primary' href={builderLoginUrl}>
            Sign in to apply
          </Button>
        )}
      </Stack>
      <Stepper
        activeStep={tab === 'github' ? 0 : 1}
        orientation='horizontal'
        connector={null}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          '& .MuiStepIcon-root.Mui-completed': {
            fill: (theme) => theme.palette.text.disabled,
            stroke: 'transparent'
          },
          '& .MuiStepIcon-root': {
            color: 'transparent',
            cursor: 'pointer',
            stroke: (theme) => theme.palette.secondary.main
          },
          '& .MuiStepIcon-root.Mui-active': {
            color: (theme) => theme.palette.secondary.main,
            '& text': {
              stroke: (theme) => theme.palette.secondary.contrastText
            }
          }
        }}
      >
        <Step active={tab === 'github'} disabled={isBuilder} completed={isBuilder}>
          <StepLabel onClick={() => setTab('github')} />
        </Step>
        <Step active={tab === 'wallet'} disabled={hasPrimaryWallet} completed={hasPrimaryWallet}>
          <StepLabel onClick={() => setTab('wallet')} />
        </Step>
      </Stepper>
    </Dialog>
  );
}
