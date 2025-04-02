'use client';

import { log } from '@charmverse/core/log';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { LoadingButton } from '@mui/lab';
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
  const { user } = useUser();
  const trackEvent = useTrackEvent();
  const [authPopup, setAuthPopup] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const isAuthenticated = Boolean(user?.id);

  function onClose() {
    setIsRegisterModalOpen(false);
  }

  const { execute, isExecuting } = useAction(registerForMatchupAction, {
    async onSuccess() {
      toast.success('Successfully registered for matchup');
      revalidatePathAction();
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
      >
        {registered ? 'Registered' : 'Register 50'}
      </Button>
      <Dialog open={isRegisterModalOpen} onClose={onClose} maxWidth='xs' fullWidth>
        <DialogTitle>Confirm Registration</DialogTitle>
        <DialogContent>
          <DialogContentText component='div'>
            <Stack spacing={2}>
              <Typography>Are you sure you want to register?</Typography>
            </Stack>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' onClick={onClose} disabled={isExecuting}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleConfirmRegistration}
            variant='contained'
            color='secondary'
            endIcon={<PointsIcon color='inherit' />}
            loading={isExecuting}
          >
            Register 50
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <SignInModalMessage open={authPopup} onClose={() => setAuthPopup(false)} />
    </>
  );
}
