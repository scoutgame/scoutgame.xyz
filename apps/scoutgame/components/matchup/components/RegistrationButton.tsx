'use client';

import { log } from '@charmverse/core/log';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material';
import { MATCHUP_REGISTRATION_FEE } from '@packages/matchup/config';
import { registerForMatchupAction } from '@packages/matchup/registerForMatchupAction';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';

import { useGlobalModal } from 'components/common/ModalProvider';

export function RegistrationButton({ registered, week }: { registered: boolean; week: string }) {
  const { user } = useUser();
  const trackEvent = useTrackEvent();
  const { openModal } = useGlobalModal();
  const pathname = usePathname();
  const isAuthenticated = Boolean(user?.id);
  const hasEnoughPoints = user?.currentBalance && user.currentBalance >= MATCHUP_REGISTRATION_FEE;

  // const { execute, isExecuting } = useAction(registerForMatchupAction, {
  //   async onSuccess() {
  //     toast.success('Successfully registered for matchup');
  //     revalidatePathAction();
  //     refreshUser();
  //     onClose();
  //   },
  //   onError(err) {
  //     toast.error('Error registering for matchup');
  //     log.error('Error registering for matchup', { error: err });
  //     onClose();
  //   }
  // });

  function handleRegister() {
    trackEvent('click_register_matchup');
    if (isAuthenticated) {
      openModal('draftRegistration', { week });
    } else {
      openModal('signIn', { path: pathname });
    }
  }
  return (
    <Button
      disabled={registered}
      variant='contained'
      color='secondary'
      endIcon={
        registered ? (
          <CheckCircleIcon color='inherit' />
        ) : (
          <Image src='/images/dev-token-logo.png' alt='DEV' width={20} height={20} />
        )
      }
      onClick={handleRegister}
      sx={{ whiteSpace: 'nowrap', width: { xs: '100%', md: 'auto' } }}
    >
      {registered ? 'Registered' : `Register ${MATCHUP_REGISTRATION_FEE}`}
    </Button>
  );
}
