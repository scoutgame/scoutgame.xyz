'use client';

import type { BuilderStatus } from '@charmverse/core/prisma';
import type { SxProps } from '@mui/material';
import { Box, Button, Stack, Typography } from '@mui/material';
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

const MAX_DEV_TOKEN_PRICE = 5100; // the "51st" dev token would cost 5100, which is impossible so we can use this as a proxy for "no price"

export function ScoutButton({
  builder,
  markStarterCardPurchased = false,
  isStarterCard = false,
  type = 'default',
  soldOutButtonSx
}: {
  soldOutButtonSx?: SxProps;
  builder: Omit<NFTPurchaseProps['builder'], 'nftType'> & { builderStatus: BuilderStatus | null };
  markStarterCardPurchased?: boolean;
  isStarterCard?: boolean;
  type?: 'default' | 'starter_pack';
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
    if (isAuthenticated) {
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

  if (formattedPrice === MAX_DEV_TOKEN_PRICE) {
    return (
      <Button disabled variant='buy' sx={soldOutButtonSx}>
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
          <Button
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
        )}
      </DynamicLoadingContext.Provider>
    </div>
  );
}
