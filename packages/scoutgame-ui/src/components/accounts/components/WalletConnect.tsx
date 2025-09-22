'use client';

import { log } from '@charmverse/core/log';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Button, Chip, IconButton, Menu, MenuItem, Paper, Stack, Typography } from '@mui/material';
import { connectWalletAccountAction } from '@packages/scoutgame/wallets/connectWalletAccountAction';
import type { WalletAuthData } from '@packages/scoutgame/wallets/connectWalletAccountSchema';
import { deleteWalletAction } from '@packages/scoutgame/wallets/deleteWalletAction';
import { mergeUserWalletAccountAction } from '@packages/scoutgame/wallets/mergeUserWalletAccountAction';
import { updatePrimaryWalletAction } from '@packages/scoutgame/wallets/updatePrimaryWalletAction';
import { RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { useAction } from 'next-safe-action/hooks';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { SiweMessage } from 'siwe';
import { toast } from 'sonner';
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
      onSuccess: ({ data }) => connectAccountOnSuccess(data?.connectedUser || undefined),
      onError: connectAccountOnError
    }
  );

  const { executeAsync: updatePrimaryWallet, isExecuting: isUpdatingPrimaryWallet } = useAction(
    updatePrimaryWalletAction,
    {
      onSuccess: () => {
        toast.success('You updated your primary wallet with success.');
      },
      onError: () => {
        toast.error('Failed to update your primary wallet.');
      }
    }
  );

  const { executeAsync: deleteWallet, isExecuting: isDeletingWallet } = useAction(deleteWalletAction, {
    onSuccess: () => {
      toast.success('Wallet deleted successfully');
    },
    onError: (err) => {
      toast.error(`Failed. ${err.error?.serverError?.message || "Can't delete wallet"}`);
    }
  });

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

  const handleWalletConnect = useCallback(
    async (_address: string) => {
      // Wait a bit for connector to be fully ready
      await new Promise((resolve) => setTimeout(resolve, 100));

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
    },
    [chainId, signMessageAsync, connectWalletAccount, setAuthData]
  );

  useEffect(() => {
    if (address && isConnected && isConnectingWallet) {
      handleWalletConnect(address).finally(() => {
        setIsConnectingWallet(false);
      });
    }
  }, [address, isConnected, isConnectingWallet, handleWalletConnect]);

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
  const isLoading = isConnecting || isUpdatingPrimaryWallet || isDeletingWallet;

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Stack gap={1}>
        <Stack direction='row' gap={1} alignItems='center'>
          <AccountBalanceWalletOutlinedIcon />
          <Typography variant='h6'>Wallets</Typography>
        </Stack>
        <Stack gap={1.5} flexDirection='column' display='grid' gridTemplateColumns='auto 1fr' justifyItems='start'>
          {user.wallets
            .sort((a, b) => (a.primary ? -1 : b.primary ? 1 : 0))
            .map(({ address: wallet, primary }) => (
              <Fragment key={wallet}>
                <Stack direction='row' gap={1}>
                  <Typography sx={{ wordBreak: 'break-word' }} component='span'>
                    {wallet}
                  </Typography>
                  {primary && <Chip label='Primary' color='secondary' size='small' />}
                </Stack>
                <Stack>
                  {user.wallets.length > 1 && (
                    <PopupState variant='popover' popupId={`dropdown-menu-${wallet}`}>
                      {(popupState) => (
                        <>
                          <IconButton disabled={isLoading || primary} sx={{ p: 0 }} {...bindTrigger(popupState)}>
                            <MoreVertIcon />
                          </IconButton>
                          <Menu
                            {...bindMenu(popupState)}
                            anchorOrigin={{
                              vertical: 'bottom',
                              horizontal: 'center'
                            }}
                            transformOrigin={{
                              vertical: 'top',
                              horizontal: 'right'
                            }}
                          >
                            <MenuItem
                              disabled={isLoading || primary}
                              onClick={() => {
                                updatePrimaryWallet({ address: wallet });
                                popupState.close();
                              }}
                            >
                              Set Primary
                            </MenuItem>
                            <MenuItem
                              disabled={isLoading || primary}
                              onClick={() => {
                                deleteWallet({ address: wallet });
                                popupState.close();
                              }}
                            >
                              Delete
                            </MenuItem>
                          </Menu>
                        </>
                      )}
                    </PopupState>
                  )}
                </Stack>
              </Fragment>
            ))}
        </Stack>
        <Typography variant='body2'>
          <sup>*</sup>The primary wallet will receive rewards at the end of each week.
        </Typography>
        <Button
          disabled={isLoading}
          loading={isLoading}
          sx={{ width: 'fit-content' }}
          onClick={onClick}
          variant='contained'
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
          <div style={{ visibility: 'hidden' }} id='telegram-login-container' />
        </Button>

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
