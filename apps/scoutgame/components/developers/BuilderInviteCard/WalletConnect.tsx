'use client';

import { log } from '@charmverse/core/log';
import { LoadingButton } from '@mui/lab';
import { Stack, Typography } from '@mui/material';
import { connectWalletAccountAction } from '@packages/scoutgame/wallets/connectWalletAccountAction';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { fancyTrim } from '@packages/utils/strings';
import { RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect, useState } from 'react';
import { SiweMessage } from 'siwe';
import { getAddress } from 'viem';
import { useAccount, useSignMessage } from 'wagmi';

import '@rainbow-me/rainbowkit/styles.css';

export function WalletConnect({ onSuccess, connected }: { onSuccess: () => void; connected: boolean }) {
  return (
    <RainbowKitProvider>
      <WalletConnectButton onSuccess={onSuccess} connected={connected} />
    </RainbowKitProvider>
  );
}

function WalletConnectButton({ onSuccess, connected }: { onSuccess: () => void; connected: boolean }) {
  const { refreshUser } = useUser();
  const { address, chainId, isConnected } = useAccount();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connectAccountOnError = useCallback((err: any) => {
    log.error('Error connecting account', { error: err.error.serverError });
    setConnectionError(err.error.serverError?.message || 'Error connecting account');
  }, []);

  const { executeAsync: connectWalletAccount, isExecuting: isConnectingWalletAccount } = useAction(
    connectWalletAccountAction,
    {
      onSuccess: () => {
        refreshUser();
        onSuccess();
      },
      onError: connectAccountOnError
    }
  );

  function onClick() {
    if (!address) {
      // openConnectModal exists if wallet is already connected
      openConnectModal?.();
    }
    setIsConnectingWallet(true);
  }

  const { signMessageAsync } = useSignMessage({
    mutation: {
      onError(error) {
        setConnectionError(error.message);
        log.error('Error on signing with wallet', { error });
      }
    }
  });

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
    await connectWalletAccount({ message, signature });
  };

  useEffect(() => {
    if (address && isConnected && isConnectingWallet) {
      handleWalletConnect(address).finally(() => {
        setIsConnectingWallet(false);
      });
    }
  }, [address, isConnected, isConnectingWallet]);

  // If rainbowkit modal was closed by user
  useEffect(() => {
    if (!connectModalOpen && isConnectingWallet && !address) {
      setIsConnectingWallet(false);
    }
  }, [connectModalOpen, address, isConnectingWallet]);

  const isConnecting = isConnectingWalletAccount;
  const isLoading = isConnecting;

  return (
    <Stack direction='column' justifyContent='center' alignItems='center' gap={1} width='100%'>
      <LoadingButton
        disabled={isLoading || connected}
        loading={isLoading}
        sx={{ width: 'fit-content' }}
        onClick={onClick}
        variant='contained'
      >
        {connected ? `Connected as ${fancyTrim(address, 10)}` : isConnecting ? 'Connecting...' : 'Connect'}
      </LoadingButton>

      {connectionError && (
        <Typography variant='body2' color='error'>
          {connectionError}
        </Typography>
      )}
    </Stack>
  );
}
