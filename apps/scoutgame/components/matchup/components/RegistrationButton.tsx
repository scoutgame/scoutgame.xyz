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
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';

import { useGlobalModal } from 'components/common/ModalProvider';
import { SignInModalMessage } from 'components/common/ScoutButton/SignInModalMessage';

export function RegistrationButton({ registered, week }: { registered: boolean; week: string }) {
  const { refreshUser, user } = useUser();
  const trackEvent = useTrackEvent();
  const [authPopup, setAuthPopup] = useState<boolean>(false);
  const { openModal } = useGlobalModal();
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
      openModal('draftRegistration');
    } else {
      setAuthPopup(true);
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
          <Image src='/images/points.png' alt='Points' width={20} height={20} />
        )
      }
      onClick={handleRegister}
      sx={{ whiteSpace: 'nowrap', width: { xs: '100%', md: 'auto' } }}
    >
      {registered ? 'Registered' : `Register ${MATCHUP_REGISTRATION_FEE}`}
    </Button>
  );
}
