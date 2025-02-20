'use client';

import { Card, Stack, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { ScoutButton } from '../../ScoutButton/ScoutButton';

import { BuilderCardNftDisplay } from './BuilderCardNftDisplay';
import { BuilderCardStats } from './BuilderCardStats';

type RequiredBuilderInfoFields = 'displayName' | 'builderStatus' | 'id' | 'path';

export function BuilderCard({
  builder,
  showPurchaseButton = false,
  hideDetails = false,
  size = 'medium',
  disableProfileUrl = false,
  markStarterCardPurchased = false,
  type,
  hideScoutCount = false
}: {
  hideScoutCount?: boolean;
  size?: 'x-small' | 'small' | 'medium' | 'large';
  builder: Omit<Partial<BuilderInfo>, RequiredBuilderInfoFields> & Pick<BuilderInfo, RequiredBuilderInfoFields>;
  hideDetails?: boolean;
  showPurchaseButton?: boolean;
  disableProfileUrl?: boolean;
  markStarterCardPurchased?: boolean;
  type: 'default' | 'starter_pack';
}) {
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
        starterPack={type === 'starter_pack'}
      >
        {builder.builderStatus === 'banned' ? (
          <Typography textAlign='center'>SUSPENDED</Typography>
        ) : hideDetails ? null : (
          <BuilderCardStats
            {...builder}
            starterPack={type === 'starter_pack'}
            size={size}
            hideScoutCount={hideScoutCount}
          />
        )}
      </BuilderCardNftDisplay>
      {typeof builder.price !== 'undefined' && showPurchaseButton && (
        <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
          <ScoutButton builder={builder} markStarterCardPurchased={markStarterCardPurchased} type={type} />
        </Stack>
      )}
    </Card>
  );
}
