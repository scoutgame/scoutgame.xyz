'use client';

import type { DialogProps } from '@mui/material';
import { useSmScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { useConnectModal, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { Dialog } from './Dialog';

import '@rainbow-me/rainbowkit/styles.css';

export type ConnectedWalletDialogProps = DialogProps & {
  open: boolean;
  onClose: VoidFunction;
  hideCloseButton?: boolean;
  children?: ReactNode;
};

// This component opens the wallet connect modal if the user is not connected yet
function ConnectedWalletDialogComponent({ open, onClose, children, ...props }: ConnectedWalletDialogProps) {
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { address } = useAccount();
  const isDesktop = useSmScreen();
  // we need to keep track of this so we can close the modal when the user cancels
  const [isRainbowKitOpen, setIsRainbowKitOpen] = useState(false);

  // open Rainbowkit modal if not connected
  useEffect(() => {
    // If rainbowkit modal was closed by user, but our state is not updated yet, update it so we reset the parent open state
    if (!connectModalOpen && isRainbowKitOpen && !address) {
      setIsRainbowKitOpen(false);
      onClose();
    } else if (open && !address) {
      openConnectModal?.();
      setIsRainbowKitOpen(true);
    }
  }, [open, onClose, address, connectModalOpen, openConnectModal, isRainbowKitOpen]);

  return (
    <Dialog fullScreen={!isDesktop} open={open && !!address} onClose={onClose} maxWidth='md' {...props}>
      {children}
    </Dialog>
  );
}

export function ConnectedWalletDialog(props: ConnectedWalletDialogProps) {
  return (
    <RainbowKitProvider>
      <ConnectedWalletDialogComponent {...props} />
    </RainbowKitProvider>
  );
}
