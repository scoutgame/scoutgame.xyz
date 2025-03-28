import { LoadingButton } from '@mui/lab';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { isOnchainPlatform } from '@packages/utils/platform';
import Image from 'next/image';
import { useState } from 'react';

import { useTrackEvent } from '../../../hooks/useTrackEvent';
import { useGlobalModal } from '../../../providers/ModalProvider';
import { useUser } from '../../../providers/UserProvider';
import { DynamicLoadingContext } from '../Loading/DynamicLoading';
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
  const isOnchain = isOnchainPlatform();

  const handleClick = () => {
    trackEvent('click_list_button', { builderPath: builder.path });
    if (isAuthenticated) {
      openModal('nftListingPurchase', { builder, listing });
    } else {
      setAuthPopup(true);
    }
  };

  const listingPrice = isOnchain
    ? Number(BigInt(listing.price) / BigInt(10 ** devTokenDecimals))
    : Number(listing.price) / 10 ** builderTokenDecimals;

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
          {listingPrice} &nbsp;{' '}
          {isOnchain ? 'DEV' : <Image src='/images/crypto/usdc.png' alt='usdc' width={18} height={18} />}
        </LoadingButton>
        <SignInModalMessage open={authPopup} onClose={() => setAuthPopup(false)} path={`/u/${builder.path}`} />
      </DynamicLoadingContext.Provider>
    </div>
  );
}
