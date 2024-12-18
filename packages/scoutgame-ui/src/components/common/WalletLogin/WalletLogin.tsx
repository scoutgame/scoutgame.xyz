'use client';

import { log } from '@charmverse/core/log';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { LoadingButton } from '@mui/lab';
import { Box, Stack, Typography } from '@mui/material';
import { revalidatePathAction } from '@packages/scoutgame/actions/revalidatePathAction';
import { loginWithWalletAction } from '@packages/scoutgame/session/loginWithWalletAction';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { useConnectModal, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { SiweMessage } from 'siwe';
import { getAddress } from 'viem';
import { useSignMessage, useAccount } from 'wagmi';

import '@rainbow-me/rainbowkit/styles.css';

export function WalletLogin() {
  return (
    <RainbowKitProvider>
      <WalletLoginButton />
    </RainbowKitProvider>
  );
}

function WalletLoginButton() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { address, chainId, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const redirectUrlEncoded = searchParams.get('redirectUrl');
  const inviteCode = searchParams.get('invite-code');
  const referralCode = searchParams.get('ref');
  const redirectUrl = redirectUrlEncoded ? decodeURIComponent(redirectUrlEncoded) : '/';
  const { refreshUser } = useUser();
  const router = useRouter();
  const { signMessageAsync, error: signMessageError } = useSignMessage({
    mutation: {
      onError(error) {
        log.error('Error on signing with wallet', { error });
      }
    }
  });

  const { executeAsync: revalidatePath } = useAction(revalidatePathAction);

  const {
    executeAsync: loginUser,
    result,
    isExecuting: isLoggingIn
  } = useAction(loginWithWalletAction, {
    onSuccess: async ({ data }) => {
      const nextPage = !data?.onboarded ? '/welcome' : inviteCode ? '/welcome/builder' : redirectUrl || '/scout';

      if (!data?.success) {
        return;
      }

      await refreshUser(data.user);

      await revalidatePath();
      router.push(nextPage);
    }
  });

  const errorWalletMessage = signMessageError?.message || result.validationErrors?.fieldErrors.message;

  const handleWalletConnect = async (_address: string) => {
    const preparedMessage: Partial<SiweMessage> = {
      domain: window.location.host,
      address: getAddress(_address),
      uri: window.location.origin,
      version: '1',
      chainId: chainId ?? 1
    };

    const siweMessage = new SiweMessage(preparedMessage);
    const message = siweMessage.prepareMessage();
    const signature = await signMessageAsync({ message });
    await loginUser({ message, signature, inviteCode, referralCode });
  };

  function onClick() {
    if (!address) {
      // openConnectModal exists if wallet is already connected
      openConnectModal?.();
    }
    setIsConnecting(true);
  }

  useEffect(() => {
    if (address && isConnected && isConnecting) {
      handleWalletConnect(address).finally(() => {
        setIsConnecting(false);
      });
    }
  }, [address, isConnected, isConnecting]);

  // If rainbowkit modal was closed by user
  useEffect(() => {
    if (!connectModalOpen && isConnecting && !address) {
      setIsConnecting(false);
    }
  }, [connectModalOpen, address, isConnecting]);

  const isLoading = isConnecting || isLoggingIn;

  return (
    <Box width='100%'>
      {errorWalletMessage && (
        <Typography variant='body2' color='error' sx={{ mb: 2 }}>
          {errorWalletMessage || 'There was an error while logging in with your wallet'}
        </Typography>
      )}
      <LoadingButton
        loading={isLoading}
        size='large'
        variant='contained'
        onClick={onClick}
        sx={{
          '& .MuiLoadingButton-label': {
            width: '100%'
          },
          minWidth: '250px',
          px: 2.5,
          py: 1.5
        }}
      >
        <Stack direction='row' alignItems='center' gap={1} justifyContent='flex-start' width='100%'>
          <AccountBalanceWalletOutlinedIcon />
          <Typography fontWeight={600} color='white'>
            {isLoading ? '' : 'Sign in with wallet'}
          </Typography>
        </Stack>
      </LoadingButton>
    </Box>
  );
}
