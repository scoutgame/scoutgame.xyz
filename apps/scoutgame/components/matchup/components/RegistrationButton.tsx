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
import { PointsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';

import { SignInModalMessage } from 'components/common/ScoutButton/SignInModalMessage';

export function RegistrationButton({ registered, week }: { registered: boolean; week: string }) {
  const { refreshUser, user } = useUser();
  const trackEvent = useTrackEvent();
  const [authPopup, setAuthPopup] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const isAuthenticated = Boolean(user?.id);
  const hasEnoughPoints = user?.currentBalance && user.currentBalance >= MATCHUP_REGISTRATION_FEE;

  function onClose() {
    setIsRegisterModalOpen(false);
  }

  const { execute, isExecuting } = useAction(registerForMatchupAction, {
    async onSuccess() {
      toast.success('Successfully registered for matchup');
      revalidatePathAction();
      refreshUser();
      onClose();
    },
    onError(err) {
      toast.error('Error registering for matchup');
      log.error('Error registering for matchup', { error: err });
      onClose();
    }
  });

  function handleConfirmRegistration() {
    trackEvent('click_register_matchup');
    if (isAuthenticated) {
      execute({ week });
    } else {
      setAuthPopup(true);
    }
  }

  function handleRegister() {
    trackEvent('click_register_matchup');
    if (isAuthenticated) {
      setIsRegisterModalOpen(true);
    } else {
      setAuthPopup(true);
    }
  }
  return (
    <>
      <Button
        disabled={registered}
        variant='contained'
        color='secondary'
        endIcon={registered ? <CheckCircleIcon color='inherit' /> : <PointsIcon color='inherit' />}
        onClick={handleRegister}
        sx={{ whiteSpace: 'nowrap', width: { xs: '100%', md: 'auto' } }}
      >
        {registered ? 'Registered' : `Register ${MATCHUP_REGISTRATION_FEE}`}
      </Button>
      <Dialog open={isRegisterModalOpen} onClose={onClose} maxWidth='xs' fullWidth>
        <DialogTitle>Confirm Registration</DialogTitle>
        <DialogContent>
          <DialogContentText component='div'>
            <Stack spacing={2}>
              {hasEnoughPoints ? (
                <Typography>
                  You will be charged {MATCHUP_REGISTRATION_FEE} Scout Points to register for this matchup.
                </Typography>
              ) : (
                <Typography>You do not have enough Scout Points to register for this matchup.</Typography>
              )}
            </Stack>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' onClick={onClose} disabled={isExecuting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRegistration}
            variant='contained'
            color='secondary'
            endIcon={<PointsIcon color='inherit' />}
            loading={isExecuting}
            disabled={!hasEnoughPoints}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Register {MATCHUP_REGISTRATION_FEE}
          </Button>
        </DialogActions>
      </Dialog>
      <SignInModalMessage open={authPopup} onClose={() => setAuthPopup(false)} />
    </>
  );
}
