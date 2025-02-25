import 'server-only';

import { prisma } from '@charmverse/core/prisma-client';
import { Box, Card, Stack, Typography } from '@mui/material';
import { formatUnits } from 'viem';

export async function AirdropMetrics({ partner }: { partner: string }) {
  const airdrops = await prisma.partnerRewardPayoutContract.findMany({
    where: {
      partner
    },
    select: {
      tokenSymbol: true,
      tokenDecimals: true,
      rewardPayouts: {
        select: {
          amount: true,
          walletAddress: true
        }
      }
    }
  });

  const totalPayouts = airdrops.reduce(
    (acc, airdrop) => acc + airdrop.rewardPayouts.reduce((_acc, payout) => _acc + parseInt(payout.amount), 0),
    0
  );
  const totalPayoutsValue = formatUnits(totalPayouts, airdrops[0].tokenDecimals);
  const uniqueWallets = airdrops.reduce((acc, airdrop) => acc + airdrop.rewardPayouts.length, 0);

  return (
    <Card>
      <Stack direction='row' alignItems='flex-start' p={2}>
        <Typography variant='h6' sx={{ mt: 0, flexGrow: 1 }}>
          Payouts
        </Typography>
        <Stack direction='row' gap={1}>
          <MetricCard title='Total value' value={`${totalPayoutsValue} ${airdrops[0].tokenSymbol}`} />
          <MetricCard title='Weekly airdrops' value={airdrops.length} />
          {/* <MetricCard title='Total payouts' value={totalPayouts} /> */}
          <MetricCard title='Unique wallets' value={uniqueWallets} />
        </Stack>
      </Stack>
    </Card>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Box minWidth={150}>
      <Typography variant='subtitle2' color='text.secondary'>
        {title}
      </Typography>
      <Typography variant='h6'>{value.toLocaleString()}</Typography>
    </Box>
  );
}
