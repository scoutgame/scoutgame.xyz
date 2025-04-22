'use client';

import { Paper, Stack, Table, TableCell, TableRow, Typography } from '@mui/material';
import { getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import type { PartnerReward } from '@packages/scoutgame/partnerRewards/getPartnerRewardsForScout';
import type { PointsReceiptReward } from '@packages/scoutgame/points/getPointsReceiptsRewards';
import { useMemo, type ReactNode } from 'react';

import { StyledTableBody, StyledTableHead } from '../common/StyledTable';

import { PointsReceiptRewardRow } from './PointsReceiptRewardRow';

const rewardTypes = [
  'leaderboard_rank',
  'sold_nfts',
  'builder',
  'optimism_new_scout',
  'optimism_referral_champion',
  'octant_base_contribution'
];

export function PointsTable({
  pointsReceiptRewards,
  partnerRewards,
  title,
  emptyMessage,
  processingPayouts
}: {
  pointsReceiptRewards: PointsReceiptReward[];
  title: ReactNode | string;
  partnerRewards: PartnerReward[];
  emptyMessage: string;
  processingPayouts: boolean;
}) {
  const processedRewards = useMemo(() => {
    const rewards = [...pointsReceiptRewards, ...partnerRewards];

    return (
      processingPayouts
        ? rewards.filter((r) => (r.type !== 'previous_season' ? r.week !== getCurrentSeasonWeekNumber() - 1 : true))
        : rewards
    ).sort((a, b) => {
      if (a.type === 'previous_season' || b.type === 'previous_season') {
        return b.points - a.points;
      }

      if (a.week === b.week) {
        const typeOrderA = rewardTypes.indexOf(a.type);
        const typeOrderB = rewardTypes.indexOf(b.type);
        if (typeOrderA !== typeOrderB) {
          return typeOrderA - typeOrderB;
        }
        return b.points - a.points;
      }

      return b.week - a.week;
    });
  }, [pointsReceiptRewards, partnerRewards, processingPayouts]);

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
            <TableCell align='right'>POINTS</TableCell>
          </TableRow>
        </StyledTableHead>
        <StyledTableBody
          sx={{
            '& .MuiTableCell-root': {
              width: '33.33%'
            }
          }}
        >
          {processedRewards.map((pointsReceiptReward) => (
            <PointsReceiptRewardRow
              key={`${pointsReceiptReward.type === 'previous_season' ? pointsReceiptReward.season : pointsReceiptReward.week}-${pointsReceiptReward.type}`}
              pointsReceiptReward={pointsReceiptReward}
            />
          ))}
        </StyledTableBody>
      </Table>
    </Stack>
  );
}
