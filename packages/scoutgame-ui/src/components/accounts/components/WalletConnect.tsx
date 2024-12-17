'use client';

import { log } from '@charmverse/core/log';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { LoadingButton } from '@mui/lab';
import { Paper, Stack, Typography } from '@mui/material';
import { connectWalletAccountAction } from '@packages/scoutgame/wallets/connectWalletAccountAction';
import type { WalletAuthData } from '@packages/scoutgame/wallets/connectWalletAccountSchema';
import { mergeUserWalletAccountAction } from '@packages/scoutgame/wallets/mergeUserWalletAccountAction';
import { RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { SiweMessage } from 'siwe';
import { getAddress } from 'viem';
import { useAccount, useSignMessage } from 'wagmi';

import type { UserWithAccountsDetails } from '../AccountsPage';
import { useAccountConnect } from '../hooks/useAccountConnect';

import { AccountConnect } from './AccountConnect';

import '@rainbow-me/rainbowkit/styles.css';

export function WalletConnect({ user }: { user: UserWithAccountsDetails }) {
  return (
    <RainbowKitProvider>
      <WalletConnectButton user={user} />
    </RainbowKitProvider>
  );
}

function WalletConnectButton({ user }: { user: UserWithAccountsDetails }) {
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
    setConnectedUser,
    setSelectedProfile,
    isMergeDisabled,
    authData,
    onCloseModal
  } = useAccountConnect<WalletAuthData>({ user, identity: 'wallet' });
  const { address, chainId, isConnected } = useAccount();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  const { executeAsync: connectWalletAccount, isExecuting: isConnectingWalletAccount } = useAction(
    connectWalletAccountAction,
    {
      onSuccess: ({ data }) => connectAccountOnSuccess(data?.connectedUser),
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
    setAuthData({ message, signature });
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

  const { executeAsync: mergeUserWalletAccount, isExecuting: isMergingUserAccount } = useAction(
    mergeUserWalletAccountAction,
    {
      onSuccess: mergeAccountOnSuccess,
      onError: mergeAccountOnError
    }
  );

  const isConnecting = isRevalidatingPath || isMergingUserAccount || isConnectingWalletAccount;

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Stack gap={1}>
        <Stack direction='row' gap={1} alignItems='center'>
          <AccountBalanceWalletOutlinedIcon />
          <Typography variant='h6'>Wallets</Typography>
        </Stack>
        <Stack gap={1}>
          {user.wallets.map((wallet) => (
            <Typography key={wallet}>{wallet}</Typography>
          ))}
        </Stack>
        <LoadingButton
          disabled={isConnecting}
          loading={isConnecting}
          sx={{ width: 'fit-content' }}
          onClick={onClick}
          variant='contained'
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
          <div style={{ visibility: 'hidden' }} id='telegram-login-container' />
        </LoadingButton>

        {connectionError && (
          <Typography variant='body2' color='error'>
            {connectionError}
          </Typography>
        )}
      </Stack>
      {connectedUser && (
        <AccountConnect
          identity='wallet'
          accountMergeError={accountMergeError}
          isMergeDisabled={isMergeDisabled}
          isMergingUserAccount={isMergingUserAccount}
          mergeUserAccount={() => authData && mergeUserWalletAccount({ authData, selectedProfile })}
          onClose={onCloseModal}
          selectedProfile={selectedProfile}
          setSelectedProfile={setSelectedProfile}
          user={user}
          connectedUser={connectedUser}
        />
      )}
    </Paper>
  );
}
