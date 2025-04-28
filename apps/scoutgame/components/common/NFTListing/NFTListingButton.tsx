import { Button } from '@mui/material';
import { DynamicLoadingContext } from '@packages/scoutgame-ui/components/common/Loading/DynamicLoading';
import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { useGlobalModal } from 'components/common/ModalProvider';

import type { NFTListingFormProps } from './NFTListingForm';

export function NFTListingButton({ builder }: { builder: NFTListingFormProps['builder'] }) {
  const trackEvent = useTrackEvent();
  const [authPopup, setAuthPopup] = useState<boolean>(false);
  const pathname = usePathname();
  const [dialogLoadingStatus, setDialogLoadingStatus] = useState<boolean>(false);
  const { user } = useUser();
  const { openModal } = useGlobalModal();
  const isAuthenticated = Boolean(user?.id);

  const handleClick = () => {
    trackEvent('click_list_button', { builderPath: builder.path });
    if (isAuthenticated) {
      openModal('nftListing', builder);
    } else {
      openModal('signIn', { path: pathname });
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
      </DynamicLoadingContext.Provider>
    </div>
  );
}
