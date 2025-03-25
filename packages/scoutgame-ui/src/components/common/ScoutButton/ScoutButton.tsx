'use client';

import type { BuilderStatus } from '@charmverse/core/prisma';
import { LoadingButton } from '@mui/lab';
import { Button, Stack, Typography } from '@mui/material';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { isOnchainPlatform } from '@packages/utils/platform';
import Image from 'next/image';
import { useState } from 'react';

import { useTrackEvent } from '../../../hooks/useTrackEvent';
import { useGlobalModal } from '../../../providers/ModalProvider';
import { useUser } from '../../../providers/UserProvider';
import { DynamicLoadingContext } from '../Loading/DynamicLoading';
import type { NFTPurchaseProps } from '../NFTPurchaseDialog/components/NFTPurchaseForm';

import { SignInModalMessage } from './SignInModalMessage';

export function ScoutButton({
  builder,
  markStarterCardPurchased = false,
  showLabel = false,
  type = 'default'
}: {
  builder: Omit<NFTPurchaseProps['builder'], 'nftType'> & { builderStatus: BuilderStatus | null };
  markStarterCardPurchased?: boolean;
  showLabel?: boolean;
  type?: 'default' | 'starter_pack';
}) {
  const trackEvent = useTrackEvent();
  const [authPopup, setAuthPopup] = useState<boolean>(false);
  const [dialogLoadingStatus, setDialogLoadingStatus] = useState<boolean>(false);
  const { user, isLoading } = useUser();
  const { openModal } = useGlobalModal();
  const isAuthenticated = Boolean(user?.id);

  const purchaseCostInPoints = isOnchainPlatform()
    ? Number(builder?.price || 0) / 10 ** devTokenDecimals
    : convertCostToPoints(builder?.price || BigInt(0));

  const handleClick = () => {
    trackEvent('click_scout_button', { builderPath: builder.path, price: purchaseCostInPoints });
    if (isAuthenticated) {
      openModal('nftPurchase', { ...builder, nftType: type });
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
  const image = type === 'starter_pack' ? '/images/icons/binoculars-green.svg' : '/images/icons/binoculars-blue.svg';

  return (
    <div>
      <DynamicLoadingContext.Provider value={setDialogLoadingStatus}>
        {type === 'starter_pack' && markStarterCardPurchased ? (
          <Button variant='outlined' fullWidth disabled>
            Purchased
          </Button>
        ) : (
          <LoadingButton
            loading={dialogLoadingStatus}
            fullWidth
            onClick={handleClick}
            data-test={isLoading ? '' : 'scout-button'}
            variant={type === 'starter_pack' ? 'buy-starter' : 'buy'}
            sx={{
              color,
              borderColor: color
            }}
          >
            <Stack px={1} direction='row' alignItems='center' justifyContent='center' width='100%'>
              {showLabel && (
                <Typography variant='body2' color='inherit' sx={{ mr: 1, textTransform: 'uppercase' }}>
                  Starter pack
                </Typography>
              )}{' '}
              <div>
                {purchaseCostInPoints}
                <Image src={image} alt='' width={21} height={12} style={{ marginLeft: 4, marginRight: 4 }} />
              </div>
            </Stack>
          </LoadingButton>
        )}
        <SignInModalMessage open={authPopup} onClose={() => setAuthPopup(false)} path={`/u/${builder.path}`} />
      </DynamicLoadingContext.Provider>
    </div>
  );
}
