'use client';

import { log } from '@charmverse/core/log';
import { LoadingButton } from '@mui/lab';
import { Alert, Box, Paper, Stack, Typography } from '@mui/material';
import { connectTelegramAccountAction } from '@packages/scoutgame/telegram/connectTelegramAccountAction';
import { generateTelegramQrCodeAction } from '@packages/scoutgame/telegram/generateTelegramQrCodeAction';
import { mergeUserTelegramAccountAction } from '@packages/scoutgame/telegram/mergeUserTelegramAccountAction';
import { removeTelegramClientAction } from '@packages/scoutgame/telegram/removeTelegramClientAction';
import { verifyTelegramTokenAction } from '@packages/scoutgame/telegram/verifyTelegramTokenAction';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';

import { Dialog } from '../../../components/common/Dialog';
import { useMdScreen } from '../../../hooks/useMediaScreens';
import type { UserWithAccountsDetails } from '../AccountsPage';
import { useAccountConnect } from '../hooks/useAccountConnect';

import { AccountConnect } from './AccountConnect';

export type TelegramAccount = {
  id: string;
};

export function TelegramConnect({ user }: { user: UserWithAccountsDetails }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const isDesktop = useMdScreen();
  const [isSessionPasswordNeeded, setIsSessionPasswordNeeded] = useState(false);
  const {
    isRevalidatingPath,
    connectAccountOnSuccess,
    connectAccountOnError,
    mergeAccountOnSuccess,
    mergeAccountOnError,
    selectedProfile,
    accountMergeError,
    connectionError,
    setConnectionError,
    setAuthData,
    connectedUser,
    setSelectedProfile,
    isMergeDisabled,
    authData,
    onCloseModal
  } = useAccountConnect<TelegramAccount>({ user, identity: 'telegram' });

  const { executeAsync: connectTelegramAccount, isExecuting: isConnectingTelegramAccount } = useAction(
    connectTelegramAccountAction,
    {
      onSuccess: ({ data }) => connectAccountOnSuccess(data?.connectedUser),
      onError: connectAccountOnError
    }
  );

  const { executeAsync: verifyTelegramToken } = useAction(verifyTelegramTokenAction, {
    onSuccess({ data }) {
      const telegramAccount = data?.telegramUser;
      if (telegramAccount && 'id' in telegramAccount) {
        setAuthData(telegramAccount);
        connectTelegramAccount(telegramAccount);
      } else {
        log.error('Invalid Telegram account', { telegramAccount });
        setConnectionError('Invalid Telegram account');
      }
      setQrCode(null);
    },
    onError({ error }) {
      if (error.serverError?.message?.toLowerCase().includes('session password')) {
        setIsSessionPasswordNeeded(true);
      }
    }
  });

  const { executeAsync: removeTelegramClient } = useAction(removeTelegramClientAction);

  const { executeAsync: generateTelegramQrCode, isExecuting: isGeneratingQrCode } = useAction(
    generateTelegramQrCodeAction,
    {
      onSuccess: (data) => {
        if (data.data?.qrCodeImage) {
          setQrCode(data.data.qrCodeImage);
          verifyTelegramToken();
        }
      }
    }
  );

  const { executeAsync: mergeUserTelegramAccount, isExecuting: isMergingUserAccount } = useAction(
    mergeUserTelegramAccountAction,
    {
      onSuccess: mergeAccountOnSuccess,
      onError: mergeAccountOnError
    }
  );

  const isConnecting = isConnectingTelegramAccount || isRevalidatingPath || isMergingUserAccount;

  return (
    <>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Stack gap={2}>
          <Stack direction='row' gap={1} alignItems='center'>
            <Image src='/images/logos/telegram.png' alt='Telegram' width={24} height={24} />
            <Typography variant='h6'>Telegram</Typography>
          </Stack>
          {user.telegramId ? (
            <Typography variant='body1'>Connected as {user.telegramName || user.telegramId}</Typography>
          ) : (
            <>
              <LoadingButton
                loading={isConnecting || isGeneratingQrCode}
                sx={{ width: 'fit-content' }}
                onClick={() => generateTelegramQrCode()}
                variant='contained'
                disabled={!isDesktop}
              >
                {isGeneratingQrCode || isConnecting ? 'Connecting...' : 'Connect'}
                <div style={{ visibility: 'hidden' }} id='telegram-login-container' />
              </LoadingButton>
              {!isDesktop && (
                <Alert severity='warning'>Please login from desktop to connect your Telegram account.</Alert>
              )}
            </>
          )}

          {connectionError && (
            <Typography variant='body2' color='error'>
              {connectionError}
            </Typography>
          )}
        </Stack>
        {connectedUser && (
          <AccountConnect
            identity='telegram'
            accountMergeError={accountMergeError}
            isMergeDisabled={isMergeDisabled}
            isMergingUserAccount={isMergingUserAccount}
            mergeUserAccount={() => authData && mergeUserTelegramAccount({ authData, selectedProfile })}
            onClose={onCloseModal}
            selectedProfile={selectedProfile}
            setSelectedProfile={setSelectedProfile}
            user={user}
            connectedUser={connectedUser}
          />
        )}
      </Paper>
      <Dialog
        open={!!qrCode}
        onClose={() => {
          setQrCode(null);
          removeTelegramClient();
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: 0,
            borderRadius: 3
          }}
        >
          <Typography variant='h6' fontWeight='bold'>
            Sign in with Telegram
          </Typography>
          <Typography variant='body1' color='secondary'>
            Go to Telegram app, Settings &gt; Devices &gt; Link Device and scan the QR.
          </Typography>

          <Box display='flex' justifyContent='center' flexDirection='column' my={2} gap={2} alignItems='center' pt={2}>
            <img width={250} height={250} src={qrCode || ''} alt='Telegram QR Code' />
          </Box>
          <Typography color='textDisabled' variant='subtitle2'>
            The QR code will expire in 30 seconds. Once scanned, please wait upto 15 seconds to be verified. If it
            fails, close the dialog and try again.
          </Typography>
          {isSessionPasswordNeeded && (
            <Alert severity='warning' sx={{ mt: 2 }}>
              You have 2FA enabled. Please disable it momentarily, close the dialog, scan the QR code and then enable it
              back again.
            </Alert>
          )}
        </Paper>
      </Dialog>
    </>
  );
}
