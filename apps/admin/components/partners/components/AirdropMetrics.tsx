import 'server-only';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import {
  Box,
  Card,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TableContainer
} from '@mui/material';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getDateFromISOWeek } from '@packages/dates/utils';
import { DateTime } from 'luxon';
import { formatUnits } from 'viem';

import { WalletAddress } from 'components/common/WalletAddress';

export async function AirdropMetrics({
  partner,
  walletAddress
}: {
  partner: string;
  walletAddress: string | undefined;
}) {
  const airdrops = await prisma.partnerRewardPayoutContract.findMany({
    where: {
      partner
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      week: true,
      tokenAddress: true,
      chainId: true,
      tokenSymbol: true,
      tokenDecimals: true,
      rewardPayouts: {
        select: {
          amount: true,
          walletAddress: true,
          claimedAt: true
        }
      }
    }
  });
  const chainId = airdrops[0]?.chainId;
  const tokenAddress = airdrops[0]?.tokenAddress;
  const tokenDecimals = airdrops[0]?.tokenDecimals;
  const tokenSymbol = airdrops[0]?.tokenSymbol;

  let walletBalance = BigInt(0);
  if (walletAddress && tokenAddress && chainId) {
    const publicClient = getPublicClient(chainId);

    try {
      const balance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ],
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`]
      });

      walletBalance = balance;
    } catch (error) {
      log.error('Error fetching wallet balance:', { error });
    }
  }

  const zero = BigInt(0);

  const toEth = (v: bigint) => {
    const num = Number(formatUnits(v, tokenDecimals));
    return Number.isInteger(num)
      ? num.toString()
      : num.toLocaleString(undefined, {
          maximumFractionDigits: 2
        });
  };
  return (
    <Card>
      <Stack direction='row' alignItems='flex-start' p={2}>
        <Box flexGrow={1}>
          <Typography variant='h6' sx={{ mt: 0, mb: 3 }}>
            Rewards
          </Typography>
          <Stack direction='row' gap={1}>
            <MetricCard
              title={
                <>
                  Wallet{' '}
                  {walletAddress ? (
                    <WalletAddress address={walletAddress} chainId={chainId} />
                  ) : (
                    <Typography component='span' fontSize='inherit' color='error'>
                      (missing env var)
                    </Typography>
                  )}
                </>
              }
              value={tokenSymbol ? `${toEth(walletBalance)} ${tokenSymbol}` : ''}
            />
            {/* <MetricCard title='Total paid' value={`${toEth(totalPayouts)} ${tokenSymbol}`} /> */}
          </Stack>
        </Box>
        {/* <MetricCard title='Unique wallets' value={uniqueWallets} />
          <MetricCard title='Unclaimed payouts' value={unclaimedPayouts} /> */}

        <Box sx={{ flexGrow: 1 }}>
          <TableContainer sx={{ maxHeight: '200px' }}>
            <Table stickyHeader size='small'>
              <TableHead>
                <TableRow sx={{ '.MuiTableCell-root': { backgroundColor: 'background.paper' } }}>
                  <TableCell>Week start</TableCell>
                  <TableCell align='right'>Wallets</TableCell>
                  <TableCell align='right'>Claimed </TableCell>
                  <TableCell align='right'>Unclaimed </TableCell>
                  <TableCell align='right'>Total </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {airdrops.map((airdrop) => {
                  const claimed = airdrop.rewardPayouts
                    .filter((p) => p.claimedAt)
                    .reduce((sum, p) => sum + BigInt(p.amount), zero);
                  const unclaimed = airdrop.rewardPayouts
                    .filter((p) => !p.claimedAt)
                    .reduce((sum, p) => sum + BigInt(p.amount), zero);
                  return (
                    <TableRow key={airdrop.week}>
                      <TableCell>{getDateFromISOWeek(airdrop.week).toFormat('MMM d')}</TableCell>
                      <TableCell align='right'>
                        {new Set(airdrop.rewardPayouts.map((p) => p.walletAddress)).size}
                      </TableCell>
                      <TableCell align='right'>{toEth(claimed)}</TableCell>
                      <TableCell align='right'>{toEth(unclaimed)}</TableCell>
                      <TableCell align='right'>{toEth(claimed + unclaimed)}</TableCell>
                    </TableRow>
                  );
                })}
                {/* sum all the values */}
                <TableRow
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    position: 'sticky',
                    bottom: 0,
                    backgroundColor: 'background.default',
                    // backgroundColor: 'var(--mui-palette-grey-000)',
                    borderTop: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <TableCell>Total</TableCell>
                  <TableCell align='right'>
                    {new Set(airdrops.flatMap((a) => a.rewardPayouts.map((p) => p.walletAddress))).size}
                  </TableCell>
                  <TableCell align='right'>
                    {toEth(
                      airdrops.reduce(
                        (sum, a) =>
                          sum +
                          a.rewardPayouts.filter((p) => p.claimedAt).reduce((pSum, p) => pSum + BigInt(p.amount), zero),
                        zero
                      )
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    {toEth(
                      airdrops.reduce(
                        (sum, a) =>
                          sum +
                          a.rewardPayouts
                            .filter((p) => !p.claimedAt)
                            .reduce((pSum, p) => pSum + BigInt(p.amount), zero),
                        zero
                      )
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    {toEth(
                      airdrops.reduce(
                        (sum, a) => sum + a.rewardPayouts.reduce((pSum, p) => pSum + BigInt(p.amount), zero),
                        zero
                      )
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
    </Card>
  );
}

function MetricCard({ title, value }: { title: string | React.ReactNode; value: number | string }) {
  return (
    <Box minWidth={150}>
      <Typography variant='subtitle2' color='text.secondary'>
        {title}
      </Typography>
      <Typography variant='h6'>{value.toLocaleString()}</Typography>
    </Box>
  );
}
