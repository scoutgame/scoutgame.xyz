import 'server-only';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import {
  Box,
  Card,
  Chip,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TableContainer,
  Tooltip
} from '@mui/material';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getDateFromISOWeek, getCurrentWeek, getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import { getMatchupRewards } from '@packages/matchup/getMatchupRewards';
import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerReward/getBuilderEventsForPartnerReward';
import { getReferralsToReward } from '@packages/scoutgame/quests/getReferralsToReward';
import { getNewScoutRewards } from '@packages/scoutgame/scouts/getNewScoutRewards';
import { DateTime } from 'luxon';
import { formatUnits, parseUnits } from 'viem';

import { WalletAddress } from 'components/common/WalletAddress';

export async function AirdropMetrics({
  partner,
  walletAddress
}: {
  partner: string;
  walletAddress: string | undefined;
}) {
  const currentWeek = getCurrentWeek();
  const airdropsData = await prisma.partnerRewardPayoutContract.findMany({
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

  const zero = BigInt(0);
  const chainId = airdropsData[0]?.chainId;
  const tokenAddress = airdropsData[0]?.tokenAddress;
  const tokenDecimals = airdropsData[0]?.tokenDecimals;
  const tokenSymbol = airdropsData[0]?.tokenSymbol;

  const toEth = (v: bigint) => {
    const num = Number(formatUnits(v, tokenDecimals));
    return Number.isInteger(num)
      ? num.toString()
      : num.toLocaleString(undefined, {
          maximumFractionDigits: 2
        });
  };

  const toWei = (v: number) => {
    return parseUnits(v.toString(), tokenDecimals);
  };

  const airdrops = airdropsData.map((airdrop) => {
    const claimed = airdrop.rewardPayouts.filter((p) => p.claimedAt).reduce((sum, p) => sum + BigInt(p.amount), zero);
    const unclaimed = airdrop.rewardPayouts
      .filter((p) => !p.claimedAt)
      .reduce((sum, p) => sum + BigInt(p.amount), zero);
    const walletAddresses = new Set(airdrop.rewardPayouts.map((p) => p.walletAddress));
    const wallets = walletAddresses.size;
    return {
      isCurrentWeek: false,
      walletAddresses: Array.from(walletAddresses),
      week: airdrop.week,
      wallets,
      claimed,
      unclaimed,
      total: claimed + unclaimed
    };
  });
  // add the upcoming payout for referral rewards
  if (partner === 'optimism_referral_champion') {
    const referrals = await getReferralsToReward({ week: currentWeek });
    if (referrals.length > 0) {
      const upcomingPayout = referrals.reduce((sum, referral) => sum + toWei(referral.opAmount), BigInt(0));
      airdrops.unshift({
        isCurrentWeek: true,
        week: currentWeek,
        wallets: referrals.length,
        walletAddresses: referrals.map((r) => r.address),
        claimed: zero,
        unclaimed: upcomingPayout,
        total: upcomingPayout
      });
    }
  } else if (partner === 'optimism_new_scout') {
    const scouts = await getNewScoutRewards({ week: currentWeek });
    if (scouts.length > 0) {
      const upcomingPayout = scouts.reduce((sum, scout) => sum + toWei(scout.opAmount), BigInt(0));
      airdrops.unshift({
        isCurrentWeek: true,
        week: currentWeek,
        wallets: scouts.length,
        walletAddresses: scouts.map((s) => s.address),
        claimed: zero,
        unclaimed: upcomingPayout,
        total: upcomingPayout
      });
    }
  } else if (partner === 'octant_base_contribution') {
    const builderEvents = await getBuilderEventsForPartnerRewards({ week: currentWeek, bonusPartner: 'octant' });
    if (builderEvents.length > 0) {
      const upcomingPayout = builderEvents.reduce((sum, event) => sum + toWei(75), BigInt(0));
      const uniqueWallets = new Set(builderEvents.map((event) => event.githubUser.builder!.wallets[0]?.address));
      airdrops.unshift({
        isCurrentWeek: true,
        week: currentWeek,
        wallets: uniqueWallets.size,
        walletAddresses: Array.from(uniqueWallets),
        claimed: zero,
        unclaimed: upcomingPayout,
        total: upcomingPayout
      });
    }
  } else if (partner === 'matchup_rewards') {
    const rewards = await getMatchupRewards(currentWeek);
    if (rewards.length > 0) {
      const upcomingPayout = rewards.reduce((sum, payout) => sum + payout.opAmount, BigInt(0));
      airdrops.unshift({
        isCurrentWeek: true,
        week: currentWeek,
        wallets: rewards.length,
        walletAddresses: rewards.map((r) => r.address),
        claimed: zero,
        unclaimed: upcomingPayout,
        total: upcomingPayout
      });
    }
  } else {
    log.error(`Please implement the current week payout for partner: ${partner}`);
  }

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

  const isLowBalance = walletBalance < airdrops[0].total;

  return (
    <Card>
      <Stack direction='row' alignItems='flex-start' p={2}>
        <Box flexGrow={1}>
          <Typography variant='h6' sx={{ mt: 0, mb: 3 }}>
            Airdrops
          </Typography>
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
            color={isLowBalance ? 'error' : undefined}
          />
          {isLowBalance && (
            <Typography variant='subtitle2' color='error'>
              Needs funds for next airdrop
            </Typography>
          )}
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <TableContainer sx={{ maxHeight: '200px' }}>
            <Table stickyHeader size='small'>
              <TableHead>
                <TableRow sx={{ '.MuiTableCell-root': { backgroundColor: 'background.paper' } }}>
                  <TableCell></TableCell>
                  <TableCell align='right'>Wallets</TableCell>
                  <TableCell align='right'>Claimed </TableCell>
                  <TableCell align='right'>Unclaimed </TableCell>
                  <TableCell align='right'>Total </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {airdrops.map((airdrop) => {
                  return (
                    <TableRow
                      key={airdrop.week}
                      sx={
                        airdrop.isCurrentWeek
                          ? {
                              '& .MuiTableCell-root': {
                                color: isLowBalance ? 'error.main' : 'secondary.main'
                              }
                            }
                          : undefined
                      }
                    >
                      <TableCell>
                        <WeekValue week={airdrop.week} />
                      </TableCell>
                      <TableCell align='right'>{airdrop.wallets}</TableCell>
                      <TableCell align='right'>
                        {typeof airdrop.claimed === 'bigint' ? toEth(airdrop.claimed) : '-'}
                      </TableCell>
                      <TableCell align='right'>
                        {typeof airdrop.unclaimed === 'bigint' ? toEth(airdrop.unclaimed) : '-'}
                      </TableCell>
                      <TableCell align='right'>{toEth(airdrop.total)}</TableCell>
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
                  <TableCell align='right'>{new Set(airdrops.flatMap((a) => a.walletAddresses)).size}</TableCell>
                  <TableCell align='right'>
                    {toEth(airdrops.reduce((sum, a) => sum + (a.claimed || zero), zero))}
                  </TableCell>
                  <TableCell align='right'>
                    {toEth(airdrops.reduce((sum, a) => sum + (a.unclaimed || zero), zero))}
                  </TableCell>
                  <TableCell align='right'>{toEth(airdrops.reduce((sum, a) => sum + a.total, zero))}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
    </Card>
  );
}

function MetricCard({
  title,
  value,
  color
}: {
  title: string | React.ReactNode;
  value: number | string;
  color?: string;
}) {
  return (
    <Box minWidth={150}>
      <Typography variant='subtitle2' color='text.secondary'>
        {title}
      </Typography>
      <Typography variant='h6' color={color}>
        {value.toLocaleString()}
      </Typography>
    </Box>
  );
}

export function WeekValue({ week }: { week: string }) {
  return (
    <Stack direction='row' alignItems='center' gap={2} width='130px' position='relative'>
      {week === getCurrentWeek() && (
        <Tooltip title='Current week' enterDelay={100}>
          <Box
            component='span'
            sx={{
              position: 'absolute',
              left: '-15px',
              top: '8px',
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'success.main'
            }}
          />
        </Tooltip>
      )}
      <Typography component='span' fontSize='inherit' sx={{ width: '60px' }}>
        Week {getCurrentSeasonWeekNumber(week)}
      </Typography>
      <Typography fontSize='inherit' component='span' color='secondary'>
        {getDateFromISOWeek(week).toFormat('MMM d')}
      </Typography>
    </Stack>
  );
}
