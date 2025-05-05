'use client';

import { Paper, Stack, Table, TableCell, TableRow, Typography } from '@mui/material';
import { getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import type { PartnerReward } from '@packages/scoutgame/partnerRewards/getPartnerRewardsForScout';
import type { TokensReceiptReward } from '@packages/scoutgame/points/getTokensReceiptsRewards';
import { useMemo, type ReactNode } from 'react';

import { StyledTableBody, StyledTableHead } from '../common/StyledTable';

import { TokensReceiptRewardRow } from './TokensReceiptRewardRow';

const rewardTypes = [
  'leaderboard_rank',
  'sold_nfts',
  'developer',
  'matchup_winner',
  'optimism_referral_champion',
  'octant_base_contribution'
];

export function TokensTable({
  tokensReceiptRewards,
  partnerRewards,
  title,
  emptyMessage,
  processingPayouts
}: {
  tokensReceiptRewards: TokensReceiptReward[];
  title: ReactNode | string;
  partnerRewards: PartnerReward[];
  emptyMessage: string;
  processingPayouts: boolean;
}) {
  const processedRewards = useMemo(() => {
    const rewards = [...tokensReceiptRewards, ...partnerRewards];

    return (processingPayouts ? rewards.filter((r) => r.week !== getCurrentSeasonWeekNumber() - 1) : rewards).sort(
      (a, b) => {
        if (a.week === b.week) {
          const typeOrderA = rewardTypes.indexOf(a.type);
          const typeOrderB = rewardTypes.indexOf(b.type);
          if (typeOrderA !== typeOrderB) {
            return typeOrderA - typeOrderB;
          }
          return b.points - a.points;
        }

        return b.week - a.week;
      }
    );
  }, [tokensReceiptRewards, partnerRewards, processingPayouts]);

  if (processedRewards.length === 0) {
    return (
      <Stack gap={0.5} alignItems='center'>
        <Typography variant='h6' color='secondary'>
          {title}
        </Typography>
        <Paper
          sx={{
            width: '100%',
            px: 2.5,
            py: 4,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Typography variant='h6' textAlign='center'>
            {emptyMessage}
          </Typography>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack gap={0.5} alignItems='center'>
      <Typography variant='h6' color='secondary'>
        {title}
      </Typography>
      <Table>
        <StyledTableHead
          sx={{
            '& .MuiTableCell-root': { width: '33.33%' }
          }}
        >
          <TableRow>
            <TableCell align='left'>ACTION</TableCell>
            <TableCell align='center'>WEEK</TableCell>
            <TableCell align='right'>TOKENS</TableCell>
          </TableRow>
        </StyledTableHead>
        <StyledTableBody
          sx={{
            '& .MuiTableCell-root': {
              width: '33.33%'
            }
          }}
        >
          {processedRewards.map((tokensReceiptReward) => (
            <TokensReceiptRewardRow
              key={`${tokensReceiptReward.week}-${tokensReceiptReward.type}`}
              tokensReceiptReward={tokensReceiptReward}
            />
          ))}
        </StyledTableBody>
      </Table>
    </Stack>
  );
}
