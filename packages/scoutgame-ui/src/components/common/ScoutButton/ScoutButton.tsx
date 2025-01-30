'use client';

import type { BuilderStatus } from '@charmverse/core/prisma';
import { LoadingButton } from '@mui/lab';
import { Button } from '@mui/material';
import { getPlatform } from '@packages/mixpanel/platform';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState } from 'react';

import { useTrackEvent } from '../../../hooks/useTrackEvent';
import { useGlobalModal } from '../../../providers/ModalProvider';
import { useUser } from '../../../providers/UserProvider';
import { DynamicLoadingContext, LoadingComponent } from '../Loading/DynamicLoading';
import type { NFTPurchaseProps } from '../NFTPurchaseDialog/components/NFTPurchaseForm';

import { SignInModalMessage } from './SignInModalMessage';

const NFTPurchaseDialog = dynamic(
  () => import('../NFTPurchaseDialog/NFTPurchaseDialog').then((mod) => mod.NFTPurchaseDialog),
  {
    loading: LoadingComponent,
    ssr: false
  }
);

export function ScoutButton({
  builder,
  markStarterCardPurchased = false,
  type = 'default'
}: {
  builder: NFTPurchaseProps['builder'] & { builderStatus: BuilderStatus | null };
  markStarterCardPurchased?: boolean;
  type?: 'default' | 'starter_pack';
}) {
  const trackEvent = useTrackEvent();
  const [authPopup, setAuthPopup] = useState<boolean>(false);
  const [dialogLoadingStatus, setDialogLoadingStatus] = useState<boolean>(false);
  const { user, isLoading } = useUser();
  const { openModal } = useGlobalModal();
  const isAuthenticated = Boolean(user?.id);

  const platform = getPlatform();

  // We need to migrate $SCOUT based NFT prices to numeric column. Until then, we are storing the price as the human friendly version
  const purchaseCostInPoints =
    platform === 'onchain_webapp' ? Number(builder?.price || 0) : convertCostToPoints(builder?.price || BigInt(0));

  const handleClick = () => {
    trackEvent('click_scout_button', { builderPath: builder.path, price: purchaseCostInPoints });
    if (isAuthenticated) {
      openModal('nftPurchase', builder);
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

  const color = type === 'starter_pack' ? 'green.main' : undefined;
  const image =
    type === 'starter_pack' ? '/images/profile/scout-game-green-icon.svg' : '/images/profile/scout-game-blue-icon.svg';

  return (
    <div>
      <DynamicLoadingContext.Provider value={setDialogLoadingStatus}>
        {builder.nftType === 'starter_pack' && markStarterCardPurchased ? (
          <Button variant='outlined' fullWidth disabled>
            Purchased
          </Button>
        ) : (
          <LoadingButton
            loading={dialogLoadingStatus}
            fullWidth
            onClick={handleClick}
            data-test={isLoading ? '' : 'scout-button'}
            variant='buy'
            sx={{ color, borderColor: color }}
          >
            {purchaseCostInPoints}
            <Image
              src={image}
              alt='Scout game points'
              width={21}
              height={12}
              style={{ marginLeft: 4, marginRight: 4 }}
            />
          </LoadingButton>
        )}
        <SignInModalMessage open={authPopup} onClose={() => setAuthPopup(false)} path={`/u/${builder.path}`} />
      </DynamicLoadingContext.Provider>
    </div>
  );
}
