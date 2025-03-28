import { LoadingButton } from '@mui/lab';
import { useState } from 'react';

import { useTrackEvent } from '../../../hooks/useTrackEvent';
import { useGlobalModal } from '../../../providers/ModalProvider';
import { useUser } from '../../../providers/UserProvider';
import { DynamicLoadingContext } from '../Loading/DynamicLoading';
import { SignInModalMessage } from '../ScoutButton/SignInModalMessage';

import type { NFTListingFormProps } from './NFTListingForm';

export function NFTListingButton({ builder }: { builder: NFTListingFormProps['builder'] }) {
  const trackEvent = useTrackEvent();
  const [authPopup, setAuthPopup] = useState<boolean>(false);
  const [dialogLoadingStatus, setDialogLoadingStatus] = useState<boolean>(false);
  const { user } = useUser();
  const { openModal } = useGlobalModal();
  const isAuthenticated = Boolean(user?.id);

  const handleClick = () => {
    trackEvent('click_list_button', { builderPath: builder.path });
    if (isAuthenticated) {
      openModal('nftListing', builder);
    } else {
      setAuthPopup(true);
    }
  };

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
          List
        </LoadingButton>
        <SignInModalMessage open={authPopup} onClose={() => setAuthPopup(false)} path={`/u/${builder.path}`} />
      </DynamicLoadingContext.Provider>
    </div>
  );
}
