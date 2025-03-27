'use client';

import { Card, Stack, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { useLgScreen, useMdScreen } from '../../../../hooks/useMediaScreens';
import { ScoutButton } from '../../ScoutButton/ScoutButton';

import { BuilderCardNftDisplay } from './BuilderCardNftDisplay';
import { BuilderCardStats } from './BuilderCardStats';
import { ListDeveloperCardButton } from './ListDeveloperCardButton';
import { PurchaseListedCardButton } from './PurchaseListedCardButton';

type RequiredBuilderInfoFields = 'displayName' | 'builderStatus' | 'id' | 'path';

export function BuilderCard({
  builder,
  showPurchaseButton = false,
  hideDetails = false,
  size: sizeOverride,
  disableProfileUrl = false,
  markStarterCardPurchased = false,
  type,
  showListButton = false
}: {
  size?: 'x-small' | 'small' | 'medium' | 'large';
  builder: Omit<Partial<BuilderInfo>, RequiredBuilderInfoFields> & Pick<BuilderInfo, RequiredBuilderInfoFields>;
  hideDetails?: boolean;
  showPurchaseButton?: boolean;
  disableProfileUrl?: boolean;
  markStarterCardPurchased?: boolean;
  type: 'default' | 'starter_pack';
  showListButton?: boolean;
}) {
  const isDesktop = useMdScreen();
  const isLgScreen = useLgScreen();
  const size = sizeOverride || (isLgScreen ? 'large' : isDesktop ? 'small' : 'x-small');
  return (
    <Card
      sx={{
        border: 'none',
        opacity: builder.builderStatus === 'banned' ? 0.25 : 1,
        width: 'fit-content',
        height: 'fit-content',
        margin: '0 auto',
        overflow: 'initial'
      }}
    >
      <BuilderCardNftDisplay
        nftImageUrl={builder.nftImageUrl}
        path={builder.path}
        level={builder.level}
        size={size}
        hideDetails={hideDetails}
        disableProfileUrl={disableProfileUrl}
        isStarterCard={type === 'starter_pack'}
      >
        {builder.builderStatus === 'banned' ? (
          <Typography textAlign='center'>SUSPENDED</Typography>
        ) : hideDetails ? null : (
          <BuilderCardStats {...builder} isStarterCard={type === 'starter_pack'} size={size} />
        )}
      </BuilderCardNftDisplay>
      {typeof builder.price !== 'undefined' && showPurchaseButton && !builder.listing?.isLower && (
        <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
          <ScoutButton builder={builder} markStarterCardPurchased={markStarterCardPurchased} type={type} />
        </Stack>
      )}
      {builder.listing && builder.listing.isLower && (
        <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
          <PurchaseListedCardButton listing={builder.listing} />
        </Stack>
      )}
      {showListButton && type !== 'starter_pack' && builder.listing === null && (
        <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
          <ListDeveloperCardButton builder={builder} />
        </Stack>
      )}
    </Card>
  );
}
