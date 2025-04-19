'use client';

import { log } from '@charmverse/core/log';
import { LoadingButton } from '@mui/lab';
import type { ButtonProps, SxProps } from '@mui/material';
import { RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import { DateTime } from 'luxon';
import { Suspense, useEffect, useState } from 'react';
import { SiweMessage } from 'siwe';
import { toast } from 'sonner';
import { getAddress } from 'viem';
import { useAccount, useSignMessage } from 'wagmi';

import '@rainbow-me/rainbowkit/styles.css';

const airdropLiveDate = DateTime.fromISO('2025-04-16T15:00:00.000Z', { zone: 'utc' });

export function WalletLogin({
  text = 'Sign in',
  variant = 'gradient',
  sx,
  isLoading
}: {
  text?: string;
  variant?: ButtonProps['variant'];
  sx?: SxProps;
  isLoading?: boolean;
}) {
  const currentTime = DateTime.now().toUTC();
  const isAirdropLive = currentTime.diff(airdropLiveDate).toMillis() > 0;

  if (!isAirdropLive) {
    return null;
  }

  return (
    <RainbowKitProvider>
      <Suspense>
        <WalletLoginButton text={text} variant={variant} sx={sx} isLoading={isLoading} />
      </Suspense>
    </RainbowKitProvider>
  );
}

function WalletLoginButton({
  text = 'Sign in',
  variant = 'gradient',
  sx,
  isLoading
}: {
  text?: string;
  variant?: ButtonProps['variant'];
  sx?: SxProps;
  isLoading?: boolean;
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { address, chainId, isConnected } = useAccount();

  const { signMessageAsync } = useSignMessage();

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
      await signMessageAsync({ message });
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

  return (
    <LoadingButton loading={isConnecting || isLoading} size='large' variant={variant} onClick={onClick} sx={sx}>
      {text}
    </LoadingButton>
  );
}
