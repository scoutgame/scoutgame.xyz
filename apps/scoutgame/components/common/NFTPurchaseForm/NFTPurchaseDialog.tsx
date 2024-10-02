'use client';

import { useConnectModal, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

import { BasicModal } from 'components/common/Modal';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { MinimalUserInfo } from 'lib/users/interfaces';

import { NFTPurchaseForm } from './NFTPurchaseForm';

import '@rainbow-me/rainbowkit/styles.css';

type NFTPurchaseDialogProps = {
  open: boolean;
  onClose: VoidFunction;
  builder: MinimalUserInfo & { price?: bigint; nftImageUrl?: string | null };
};
// This component opens the wallet connect modal if the user is not connected yet
export function NFTPurchaseDialog(props: NFTPurchaseDialogProps) {
  const { openConnectModal } = useConnectModal();
  const { address } = useAccount();
  const isDesktop = useMdScreen();

  // open Rainbowkit modal if not connected
  useEffect(() => {
    if (props.open && !address) {
      openConnectModal?.();
    }
  }, [props.open, address, openConnectModal]);

  return (
    <BasicModal
      fullScreen={!isDesktop}
      open={props.open && !!address}
      onClose={props.onClose}
      title={`Scout @${props.builder.username}`}
      maxWidth='md'
    >
      <NFTPurchaseForm builder={props.builder} />
    </BasicModal>
  );
}

export function NFTPurchaseDialogWithProviders(props: NFTPurchaseDialogProps) {
  return (
    <RainbowKitProvider>
      <NFTPurchaseDialog {...props} />
    </RainbowKitProvider>
  );
}
