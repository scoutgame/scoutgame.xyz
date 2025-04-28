import { Button } from '@mui/material';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { DynamicLoadingContext } from '@packages/scoutgame-ui/components/common/Loading/DynamicLoading';
import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { useGlobalModal } from 'components/common/ModalProvider';

import type { NFTListingPurchaseFormProps } from './NFTListingPurchaseForm';

export function NFTListingPurchaseButton({
  builder,
  listing
}: Pick<NFTListingPurchaseFormProps, 'builder' | 'listing'>) {
  const trackEvent = useTrackEvent();
  const pathname = usePathname();
  const [authPopup, setAuthPopup] = useState<boolean>(false);
  const [dialogLoadingStatus, setDialogLoadingStatus] = useState<boolean>(false);
  const { user } = useUser();
  const { openModal } = useGlobalModal();
  const isAuthenticated = Boolean(user?.id);

  const handleClick = () => {
    trackEvent('click_list_button', { builderPath: builder.path });
    if (isAuthenticated) {
      openModal('nftListingPurchase', { builder, listing });
    } else {
      openModal('signIn', { path: pathname });
    }
  };

  const listingPrice = Number(BigInt(listing.price) / BigInt(10 ** devTokenDecimals));

  if (builder.builderStatus === 'banned') {
    return (
      // @ts-ignore
      <Button disabled variant='buy'>
        SUSPENDED
      </Button>
    );
  }

  return (
    <div>
      <DynamicLoadingContext.Provider value={setDialogLoadingStatus}>
        <Button loading={dialogLoadingStatus} fullWidth onClick={handleClick} variant='buy'>
          {listingPrice} &nbsp; <img src='/images/dev-token-logo.png' alt='DEV' width={18} height={18} />
        </Button>
      </DynamicLoadingContext.Provider>
    </div>
  );
}
