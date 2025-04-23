import { Button } from '@mui/material';
import { DynamicLoadingContext } from '@packages/scoutgame-ui/components/common/Loading/DynamicLoading';
import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { useState } from 'react';

import { useGlobalModal } from 'components/common/ModalProvider';

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
      <Button disabled variant='buy'>
        SUSPENDED
      </Button>
    );
  }

  return (
    <div>
      <DynamicLoadingContext.Provider value={setDialogLoadingStatus}>
        <Button loading={dialogLoadingStatus} fullWidth onClick={handleClick} variant='buy'>
          List
        </Button>
        <SignInModalMessage open={authPopup} onClose={() => setAuthPopup(false)} path={`/u/${builder.path}`} />
      </DynamicLoadingContext.Provider>
    </div>
  );
}
