'use client';

import { Card, Stack, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { useLgScreen, useMdScreen } from '../../../../hooks/useMediaScreens';
import { useUser } from '../../../../providers/UserProvider';
import { NFTListingButton } from '../../NFTListing/NFTListingButton';
import { NFTListingEditButton } from '../../NFTListing/NFTListingEditButton';
import { NFTListingPurchaseButton } from '../../NFTListingPurchase/NFTListingPurchaseButton';
import { ScoutButton } from '../../ScoutButton/ScoutButton';

import { BuilderCardNftDisplay } from './BuilderCardNftDisplay';
import { BuilderCardStats } from './BuilderCardStats';

type RequiredBuilderInfoFields = 'displayName' | 'builderStatus' | 'id' | 'path';

const whiteListedUserIds = [
  '2dc25032-4efa-4168-b515-01b2e304d3e6',
  '16fd0183-3083-47e4-b556-0118227cd84b',
  'f9d23170-14cb-4f9f-8506-09d15c900afa'
];

export function BuilderCard({
  builder,
  showPurchaseButton = false,
  hideDetails = false,
  size: sizeOverride,
  disableProfileUrl = false,
  markStarterCardPurchased = false,
  type,
  showListButton = false,
  scoutInView
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
}) {
  const isDesktop = useMdScreen();
  const isLgScreen = useLgScreen();
  const { user } = useUser();
  const price = builder.price;

  const userListings =
    user && whiteListedUserIds.includes(user.id) && builder.listings
      ? builder.listings.filter((listing) => listing.scoutId === user.id)
      : [];

  const lowerPricedNonUserListings: BuilderInfo['listings'] = [];

  if (price && builder.listings && user && whiteListedUserIds.includes(user.id)) {
    builder.listings.forEach((listing) => {
      if (
        listing.scoutId !== user?.id &&
        BigInt(listing.price) < BigInt(price) &&
        (scoutInView ? listing.scoutId === scoutInView : true)
      ) {
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
        ) : (
          <NFTListingEditButton listing={userListings[0]} />
        ))}
    </Card>
  );
}
