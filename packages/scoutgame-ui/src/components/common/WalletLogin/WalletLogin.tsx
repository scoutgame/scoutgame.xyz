'use client';

import { log } from '@charmverse/core/log';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { LoadingButton } from '@mui/lab';
import type { ButtonProps } from '@mui/material';
import { Box, Stack, Typography } from '@mui/material';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { loginWithWalletAction } from '@packages/scoutgame/session/loginWithWalletAction';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { useConnectModal, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { Suspense, useEffect, useState } from 'react';
import { SiweMessage } from 'siwe';
import { toast } from 'sonner';
import { getAddress } from 'viem';
import { useSignMessage, useAccount } from 'wagmi';

import { useLoginSuccessHandler } from '../../../hooks/useLoginSuccessHandler';

import '@rainbow-me/rainbowkit/styles.css';

export function WalletLogin({ text, color = 'primary' }: { text?: string; color?: ButtonProps['color'] }) {
  return (
    <RainbowKitProvider>
      <Suspense>
        <WalletLoginButton text={text} color={color} />
      </Suspense>
    </RainbowKitProvider>
  );
}

function WalletLoginButton({ text, color = 'primary' }: { text?: string; color?: ButtonProps['color'] }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { address, chainId, isConnected } = useAccount();
  const { params, getNextPageLink } = useLoginSuccessHandler();
  const { inviteCode, referralCode } = params;
  const searchParams = useSearchParams();

  const utmCampaign = searchParams.get('utm_campaign');

  const { refreshUser } = useUser();
  const router = useRouter();
  const { signMessageAsync } = useSignMessage();

  const { executeAsync: revalidatePath } = useAction(revalidatePathAction);

  const {
    executeAsync: loginUser,
    result,
    isExecuting: isLoggingIn
  } = useAction(loginWithWalletAction, {
    onSuccess: async ({ data }) => {
      if (!data?.success) {
        return;
      }

      await refreshUser(data.user);

      await revalidatePath();

      router.push(getNextPageLink({ onboarded: data?.onboarded }));
    },
    onError(err) {
      log.error('Error on login', { error: err.error.serverError });
    }
  });

  const errorWalletMessage = result.validationErrors?.fieldErrors.message || result.serverError?.message;

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
    try {
      const signature = await signMessageAsync({ message });
      await loginUser({ message, signature, inviteCode, referralCode, utmCampaign: utmCampaign as string });
    } catch (error) {
      // examples: user cancels signature, user rejects signature
      log.warn('Error signing message', { error });
      toast.warning((error as Error).message);
    }
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
        color={color}
        variant='contained'
        onClick={onClick}
        sx={{
          '& .MuiLoadingButton-label': {
            width: '100%'
          },
          minWidth: '250px',
          px: 2.5,
          py: 1.5,
          fontWeight: 600
        }}
      >
        {text || (
          <Stack direction='row' alignItems='center' gap={1} justifyContent='flex-start' width='100%'>
            <AccountBalanceWalletOutlinedIcon />
            {isLoading ? '' : 'Sign in with wallet'}
          </Stack>
        )}
      </LoadingButton>
    </Box>
  );
}
