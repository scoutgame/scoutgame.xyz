import { Dialog } from '@packages/scoutgame-ui/components/common/Dialog';
import { useSmScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import type { NFTListingPurchaseFormProps } from './NFTListingPurchaseForm';
import { NFTListingPurchaseForm } from './NFTListingPurchaseForm';

type NFTListingPurchaseDialogProps = {
  open: boolean;
  onClose: VoidFunction;
  listing: NFTListingPurchaseFormProps['listing'];
  builder: NFTListingPurchaseFormProps['builder'];
};

function NFTListingPurchaseDialogComponent({ listing, open, onClose, builder }: NFTListingPurchaseDialogProps) {
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
      title={`Purchase ${builder.displayName}`}
      maxWidth='md'
      onClose={onClose}
      fullScreen={!isDesktop}
    >
      <NFTListingPurchaseForm listing={listing} builder={builder} onSuccess={onClose} />
    </Dialog>
  );
}

export function NFTListingPurchaseDialog(props: NFTListingPurchaseDialogProps) {
  if (!props.listing) {
    return null;
  }

  return (
    <RainbowKitProvider>
      <NFTListingPurchaseDialogComponent {...props} />
    </RainbowKitProvider>
  );
}
