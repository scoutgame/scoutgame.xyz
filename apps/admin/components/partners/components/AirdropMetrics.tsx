import 'server-only';

import { prisma } from '@charmverse/core/prisma-client';
import { Card, Stack, Typography } from '@mui/material';
import type { BonusPartner } from '@packages/scoutgame/bonus';

export async function AirdropMetrics({ partner }: { partner: BonusPartner }) {
  const [airdrops, totalPayouts, uniqueWallets] = await Promise.all([
    prisma.partnerRewardPayoutContract.count({
      where: {
        partner
      }
    }),
    prisma.partnerRewardPayout.count({
      where: {
        payoutContract: {
          partner
        }
      }
    }),
    prisma.partnerRewardPayout
      .findMany({
        where: {
          payoutContract: {
            partner
          }
        },
        distinct: ['walletAddress']
      })
      .then((wallets) => wallets.length)
  ]);

  return (
    <>
      <Typography variant='h6'>Payouts</Typography>
      <Stack direction='row' spacing={2} mt={2}>
        <MetricCard title='Total airdrops' value={airdrops} />
        <MetricCard title='Total payouts' value={totalPayouts} />
        <MetricCard title='Unique wallets' value={uniqueWallets} />
      </Stack>
    </>
  );
}

function MetricCard({ title, value, decimals = 0 }: { title: string; value: number; decimals?: number }) {
  return (
    <Card sx={{ p: 2, minWidth: 150 }}>
      <Typography variant='subtitle2' color='text.secondary'>
        {title}
      </Typography>
      <Typography variant='h6'>
        {value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })}
      </Typography>
    </Card>
  );
}
