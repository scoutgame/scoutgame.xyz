'use client';

import type { BuilderStatus } from '@charmverse/core/prisma';
import type { SxProps } from '@mui/material';
import { Box, Button, Stack, Tooltip, Typography } from '@mui/material';
import { maxDevTokenPrice } from '@packages/scoutgame/builderNfts/constants';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { DynamicLoadingContext } from '@packages/scoutgame-ui/components/common/Loading/DynamicLoading';
import { useTrackEvent } from '@packages/scoutgame-ui/hooks/useTrackEvent';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import { useGlobalModal } from 'components/common/ModalProvider';

import type { NFTPurchaseProps } from '../NFTPurchaseDialog/components/NFTPurchaseForm';

export function ScoutButton({
  builder,
  markStarterCardPurchased = false,
  isStarterCard = false,
  type = 'default',
  soldOutButtonSx,
  listing
}: {
  soldOutButtonSx?: SxProps;
  builder: Omit<NFTPurchaseProps['builder'], 'nftType'> & { builderStatus: BuilderStatus | null };
  markStarterCardPurchased?: boolean;
  isStarterCard?: boolean;
  type?: 'default' | 'starter_pack';
  listing?: BuilderInfo['listings'][number] | null;
}) {
  const trackEvent = useTrackEvent();
  const [dialogLoadingStatus, setDialogLoadingStatus] = useState<boolean>(false);
  const { user, isLoading } = useUser();
  const { openModal } = useGlobalModal();
  const isAuthenticated = Boolean(user?.id);
  const pathname = usePathname();

  const formattedPrice = Number(builder?.price || 0) / 10 ** devTokenDecimals;

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    trackEvent('click_scout_button', { builderPath: builder.path, price: formattedPrice });
    if (listing) {
      openModal('nftListingPurchase', { builder, listing });
    } else if (isAuthenticated) {
      openModal('nftPurchase', { ...builder, nftType: type });
    } else {
      openModal('signIn', { path: pathname });
    }
  };

  if (builder.builderStatus === 'banned') {
    return (
      // @ts-ignore
      <Button disabled variant='buy'>
        <Box px={1}>SUSPENDED</Box>
      </Button>
    );
  }

  if (formattedPrice === maxDevTokenPrice) {
    return (
      <Button disabled variant='buy' fullWidth sx={soldOutButtonSx}>
        <Box px={1}>SOLD OUT</Box>
      </Button>
    );
  }

  const color = type === 'starter_pack' ? 'green.main' : undefined;

  return (
    <div>
      <DynamicLoadingContext.Provider value={setDialogLoadingStatus}>
        {type === 'starter_pack' && markStarterCardPurchased ? (
          <Button variant='outlined' fullWidth disabled>
            Owned
          </Button>
        ) : (
          <Tooltip title={builder.id === user?.id ? 'You cannot purchase your own card' : ''}>
            <span>
              <Button
                loading={dialogLoadingStatus}
                fullWidth
                disabled={builder.id === user?.id}
                onClick={handleClick}
                data-test={isLoading ? '' : 'scout-button'}
                variant={type === 'starter_pack' ? 'buy-starter' : 'buy'}
                sx={{
                  color,
                  borderColor: builder.id === user?.id ? 'grey.700' : color
                }}
              >
                <Stack px={1} direction='row' alignItems='center' justifyContent='center' width='100%'>
                  {isStarterCard && (
                    <Typography variant='body2' color='inherit' sx={{ mr: 1, textTransform: 'uppercase' }}>
                      Starter
                    </Typography>
                  )}{' '}
                  <Stack direction='row' alignItems='center' justifyContent='center'>
                    {formattedPrice}
                    <Image
                      src='/images/dev-token-logo.png'
                      alt='DEV Token'
                      width={20}
                      height={20}
                      style={{ marginLeft: 4, marginRight: 4 }}
                    />
                  </Stack>
                </Stack>
              </Button>
            </span>
          </Tooltip>
        )}
      </DynamicLoadingContext.Provider>
    </div>
  );
}
