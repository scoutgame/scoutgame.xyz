import 'server-only';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { Box, Card, Stack, Typography, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { formatUnits } from 'viem';

export async function AirdropMetrics({ partner, walletAddress }: { partner: string; walletAddress: string }) {
  const airdrops = await prisma.partnerRewardPayoutContract.findMany({
    where: {
      partner
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      createdAt: true,
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

  let walletBalance = 0;
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

      walletBalance = Number(balance);
    } catch (error) {
      log.error('Error fetching wallet balance:', { error });
    }
  }

  const totalPayouts = airdrops.reduce(
    (acc, airdrop) => acc + airdrop.rewardPayouts.reduce((_acc, payout) => _acc + parseInt(payout.amount), 0),
    0
  );
  const toEth = (v: bigint) => {
    const num = Number(formatUnits(v, tokenDecimals));
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };
  const uniqueWallets = airdrops.reduce((acc, airdrop) => acc + airdrop.rewardPayouts.length, 0);
  const unclaimedPayouts = airdrops.reduce(
    (acc, airdrop) => acc + airdrop.rewardPayouts.filter((payout) => !payout.claimedAt).length,
    0
  );

  return (
    <Card>
      <Stack direction='row' alignItems='flex-start' p={2}>
        <Box flexGrow={1}>
          <Typography variant='h6' sx={{ mt: 0, mb: 3 }}>
            Rewards
          </Typography>
          <Stack direction='row' gap={1}>
            <MetricCard title='Wallet balance' value={`${toEth(walletBalance)} ${tokenSymbol}`} />
            {/* <MetricCard title='Total paid' value={`${toEth(totalPayouts)} ${tokenSymbol}`} /> */}
          </Stack>
        </Box>
        {/* <MetricCard title='Unique wallets' value={uniqueWallets} />
          <MetricCard title='Unclaimed payouts' value={unclaimedPayouts} /> */}

        <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
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
                  .reduce((sum, p) => sum + BigInt(p.amount), 0n);
                const unclaimed = airdrop.rewardPayouts
                  .filter((p) => !p.claimedAt)
                  .reduce((sum, p) => sum + BigInt(p.amount), 0n);
                return (
                  <TableRow key={airdrop.id}>
                    <TableCell>{new Date(airdrop.createdAt).toLocaleDateString()}</TableCell>
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
              <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>Total</TableCell>
                <TableCell align='right'>
                  {new Set(airdrops.flatMap((a) => a.rewardPayouts.map((p) => p.walletAddress))).size}
                </TableCell>
                <TableCell align='right'>
                  {toEth(
                    airdrops.reduce(
                      (sum, a) =>
                        sum +
                        a.rewardPayouts.filter((p) => p.claimedAt).reduce((pSum, p) => pSum + BigInt(p.amount), 0n),
                      0n
                    )
                  )}
                </TableCell>
                <TableCell align='right'>
                  {toEth(
                    airdrops.reduce(
                      (sum, a) =>
                        sum +
                        a.rewardPayouts.filter((p) => !p.claimedAt).reduce((pSum, p) => pSum + BigInt(p.amount), 0n),
                      0n
                    )
                  )}
                </TableCell>
                <TableCell align='right'>
                  {toEth(
                    airdrops.reduce(
                      (sum, a) => sum + a.rewardPayouts.reduce((pSum, p) => pSum + BigInt(p.amount), 0n),
                      0n
                    )
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
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
