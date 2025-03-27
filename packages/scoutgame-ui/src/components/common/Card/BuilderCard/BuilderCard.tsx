'use client';

import { Card, Stack, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { useLgScreen, useMdScreen } from '../../../../hooks/useMediaScreens';
import { useUser } from '../../../../providers/UserProvider';
import { NFTListingButton } from '../../NFTListing/NFTListingButton';
import { NFTListingPurchaseButton } from '../../NFTListingPurchase/NFTListingPurchaseButton';
import { ScoutButton } from '../../ScoutButton/ScoutButton';

import { BuilderCardNftDisplay } from './BuilderCardNftDisplay';
import { BuilderCardStats } from './BuilderCardStats';

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
  const { user } = useUser();
  const price = builder.price;

  const userListings =
    (user && builder.listings && builder.listings.filter((listing) => listing.scoutId === user.id)) ?? [];
  const lowerPricedNonUserListings: BuilderInfo['listings'] = [];
  if (price && builder.listings) {
    builder.listings.forEach((listing) => {
      if (listing.scoutId !== user?.id && listing.price < price) {
        lowerPricedNonUserListings.push(listing);
      }
    });
  }

  const lowestNonUserListing = lowerPricedNonUserListings.sort((a, b) => {
    const aPrice = a.price;
    const bPrice = b.price;
    return Number(aPrice - bPrice);
  })[0];

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
      {!showListButton &&
        (lowestNonUserListing ? (
          <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
            <NFTListingPurchaseButton builder={builder} listing={lowestNonUserListing} />
          </Stack>
        ) : typeof builder.price !== 'undefined' && showPurchaseButton ? (
          <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
            <ScoutButton builder={builder} markStarterCardPurchased={markStarterCardPurchased} type={type} />
          </Stack>
        ) : null)}
      {showListButton &&
        type !== 'starter_pack' &&
        (!userListings.length ? (
          <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
            <NFTListingButton builder={builder} />
          </Stack>
        ) : null)}
    </Card>
  );
}
