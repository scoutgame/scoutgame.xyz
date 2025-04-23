import { LoadingButton } from '@mui/lab';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { DynamicLoadingContext } from '@packages/scoutgame-ui/components/common/Loading/DynamicLoading';
import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { useState } from 'react';

import { useGlobalModal } from 'components/common/ModalProvider';

import { SignInModalMessage } from '../ScoutButton/SignInModalMessage';

import type { NFTListingPurchaseFormProps } from './NFTListingPurchaseForm';

export function NFTListingPurchaseButton({
  builder,
  listing
}: Pick<NFTListingPurchaseFormProps, 'builder' | 'listing'>) {
  const trackEvent = useTrackEvent();
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
      setAuthPopup(true);
    }
  };

  const listingPrice = Number(BigInt(listing.price) / BigInt(10 ** devTokenDecimals));

  if (builder.builderStatus === 'banned') {
    return (
      // @ts-ignore
      <LoadingButton disabled variant='buy'>
        SUSPENDED
      </LoadingButton>
    );
  }

  return (
    <div>
      <DynamicLoadingContext.Provider value={setDialogLoadingStatus}>
        <LoadingButton loading={dialogLoadingStatus} fullWidth onClick={handleClick} variant='buy'>
          {listingPrice} &nbsp; DEV
        </LoadingButton>
        <SignInModalMessage open={authPopup} onClose={() => setAuthPopup(false)} path={`/u/${builder.path}`} />
      </DynamicLoadingContext.Provider>
    </div>
  );
}
