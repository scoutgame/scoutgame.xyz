'use client';

import { Button, Card, Stack } from '@mui/material';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import { useState } from 'react';

import { NFTPurchaseDialog } from 'components/nft/NFTPurchaseDialog';
import type { BuilderInfo } from 'lib/builders/interfaces';

import { BuilderCardNftDisplay } from './BuilderCardNftDisplay';
import { BuilderCardStats } from './BuilderCardStats';

function PriceButton({ price, onClick }: { price: bigint | number; onClick: VoidFunction }) {
  return (
    <Button fullWidth onClick={onClick} variant='buy'>
      ${(Number(price) / 10 ** builderTokenDecimals).toFixed(2)}
    </Button>
  );
}

export function BuilderCard({
  builder,
  user,
  showPurchaseButton = false,
  hideDetails = false
}: {
  user?: {
    username: string;
  } | null;
  builder: BuilderInfo;
  hideDetails?: boolean;
  showPurchaseButton?: boolean;
}) {
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);

  return (
    <>
      <Card sx={{ border: 'none' }}>
        <BuilderCardNftDisplay avatar={builder.avatar} username={builder.username}>
          {hideDetails ? null : <BuilderCardStats {...builder} />}
        </BuilderCardNftDisplay>
        {typeof builder.price !== 'undefined' && showPurchaseButton && (
          <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
            <PriceButton onClick={() => setIsPurchasing(true)} price={builder.price} />
          </Stack>
        )}
      </Card>
      {isPurchasing && !!builder.price && showPurchaseButton && (
        <NFTPurchaseDialog onClose={() => setIsPurchasing(false)} builderId={builder.id} user={user} />
      )}
    </>
  );
}
