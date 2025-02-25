import 'server-only';

import { prisma } from '@charmverse/core/prisma-client';
import { Box, Card, Stack, Typography } from '@mui/material';

export async function AirdropMetrics({ partner }: { partner: string }) {
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
    <Card>
      <Stack direction='row' alignItems='flex-start' p={2}>
        <Typography variant='h6' sx={{ mt: 0, flexGrow: 1 }}>
          Payouts
        </Typography>
        <Stack direction='row'>
          <MetricCard title='Total airdrops' value={airdrops} />
          <MetricCard title='Total payouts' value={totalPayouts} />
          <MetricCard title='Unique wallets' value={uniqueWallets} />
        </Stack>
      </Stack>
    </Card>
  );
}

function MetricCard({ title, value, decimals = 0 }: { title: string; value: number; decimals?: number }) {
  return (
    <Box minWidth={150}>
      <Typography variant='subtitle2' color='text.secondary'>
        {title}
      </Typography>
      <Typography variant='h6'>
        {value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })}
      </Typography>
    </Box>
  );
}
