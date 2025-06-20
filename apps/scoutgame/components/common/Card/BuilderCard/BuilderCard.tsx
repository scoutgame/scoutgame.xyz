'use client';

import { Card, Stack, Typography, type SxProps } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { useLgScreen, useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import type { ComponentType } from 'react';

import { NFTListingButton } from '../../NFTListing/NFTListingButton';
import { NFTListingEditButton } from '../../NFTListing/NFTListingEditButton';
import { NFTListingPurchaseButton } from '../../NFTListingPurchase/NFTListingPurchaseButton';
import { ScoutButton } from '../../ScoutButton/ScoutButton';

import { BuilderCardNftDisplay } from './BuilderCardNftDisplay';
import { BuilderCardStats } from './BuilderCardStats';

type RequiredBuilderInfoFields = 'displayName' | 'builderStatus' | 'id' | 'path';

const whitelistedUsers = [
  // ccarella.eth
  'b6cb2938-91dd-4274-8d85-aa2e00eb97e2',
  // mattcasey
  '00c4af4f-b0f8-41e8-b27d-29996d694034',
  // safwan
  'f534b485-b7d5-47c3-92d8-02d107158558'
];

export function BuilderCard<T extends { builder: any } = { builder: any }>({
  builder,
  showPurchaseButton = false,
  hideDetails = false,
  size: sizeOverride,
  disableProfileUrl = false,
  markStarterCardPurchased = false,
  type,
  showListButton = false,
  scoutInView,
  actionSlot: ActionSlotComponent,
  actionSlotProps,
  variant,
  sx
}: {
  size?: 'x-small' | 'small' | 'medium' | 'large';
  builder: Omit<Partial<BuilderInfo>, RequiredBuilderInfoFields> & Pick<BuilderInfo, RequiredBuilderInfoFields>;
  hideDetails?: boolean;
  showPurchaseButton?: boolean;
  disableProfileUrl?: boolean;
  markStarterCardPurchased?: boolean;
  type: 'default' | 'starter_pack';
  showListButton?: boolean;
  scoutInView?: string;
  actionSlot?: ComponentType<T>;
  actionSlotProps?: Omit<T, 'builder'>;
  variant?: 'matchup_selection'; // has an actionSlot with a checkbox and dev name
  sx?: SxProps;
}) {
  const isDesktop = useMdScreen();
  const isLgScreen = useLgScreen();
  const { user } = useUser();
  const price = builder.price;

  const userListings = (builder.listings || []).filter((listing) => listing.scoutId === user?.id);

  const lowerPricedNonUserListings: BuilderInfo['listings'] = [];

  if (price && builder.listings) {
    builder.listings.forEach((listing) => {
      if (BigInt(listing.price) < BigInt(price) && (scoutInView ? listing.scoutId === scoutInView : true)) {
        lowerPricedNonUserListings.push(listing);
      }
    });
  }

  const lowestNonUserListing = lowerPricedNonUserListings.sort((a, b) => {
    const aPrice = a.price;
    const bPrice = b.price;

    if (aPrice === bPrice) {
      return a.createdAt.getTime() - b.createdAt.getTime();
    }

    return Number(aPrice - bPrice);
  })[0];

  const size = sizeOverride || (isLgScreen ? 'large' : isDesktop ? 'small' : 'x-small');
  return (
    <Card
      data-test={`dev-${type}-card-${builder.id}`}
      sx={{
        border: 'none',
        opacity: builder.builderStatus === 'banned' ? 0.25 : 1,
        width: 'fit-content',
        height: 'fit-content',
        margin: '0 auto',
        position: 'relative',
        zIndex: 3,
        overflow: 'initial',
        ...sx
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
        variant={variant}
      >
        {builder.builderStatus === 'banned' ? (
          <Typography textAlign='center'>SUSPENDED</Typography>
        ) : hideDetails ? null : (
          <BuilderCardStats {...builder} isStarterCard={type === 'starter_pack'} size={size} />
        )}
      </BuilderCardNftDisplay>
      {ActionSlotComponent ? (
        <ActionSlotComponent builder={builder} {...(actionSlotProps as any)} />
      ) : !showListButton ? (
        lowestNonUserListing ? (
          <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
            <NFTListingPurchaseButton builder={builder} listing={lowestNonUserListing} />
          </Stack>
        ) : typeof builder.price !== 'undefined' && showPurchaseButton ? (
          <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
            <ScoutButton builder={builder} markStarterCardPurchased={markStarterCardPurchased} type={type} />
          </Stack>
        ) : null
      ) : user && whitelistedUsers.includes(user.id) ? (
        type !== 'starter_pack' &&
        (!userListings.length ? (
          <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
            <NFTListingButton builder={builder} />
          </Stack>
        ) : (
          <NFTListingEditButton listing={userListings[0]} />
        ))
      ) : null}
    </Card>
  );
}
