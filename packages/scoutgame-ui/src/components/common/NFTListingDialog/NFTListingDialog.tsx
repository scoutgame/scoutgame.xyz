import { RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { useSmScreen } from '../../../hooks/useMediaScreens';
import { Dialog } from '../Dialog';

import { NFTListingForm, type NFTListingFormProps } from './components/NFTListingForm';

type NFTListingDialogProps = {
  open: boolean;
  onClose: VoidFunction;
  builder: NFTListingFormProps['builder'];
};

function NFTListingDialogComponent({ builder, open, onClose }: NFTListingDialogProps) {
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { address } = useAccount();
  const [isRainbowKitOpen, setIsRainbowKitOpen] = useState(false);
  const isDesktop = useSmScreen();

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
  }, [open, address, onClose, connectModalOpen, openConnectModal, isRainbowKitOpen]);

  return (
    <Dialog
      open={open && !!address}
      title={`List ${builder.displayName}`}
      maxWidth='md'
      onClose={onClose}
      fullScreen={!isDesktop}
    >
      <NFTListingForm builder={builder} onSuccess={onClose} />
    </Dialog>
  );
}

export function NFTListingDialog(props: NFTListingDialogProps) {
  if (!props.builder) {
    return null;
  }

  return (
    <RainbowKitProvider>
      <NFTListingDialogComponent {...props} />
    </RainbowKitProvider>
  );
}
