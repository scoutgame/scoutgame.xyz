'use client';

import { Paper, Stack, Table, TableCell, TableRow, Typography } from '@mui/material';
import type { PartnerReward } from '@packages/scoutgame/points/getPartnerRewards';
import type { PointsReceiptReward } from '@packages/scoutgame/points/getPointsReceiptsRewards';
import { useMemo, type ReactNode } from 'react';

import { StyledTableBody, StyledTableHead } from '../common/StyledTable';

import { PointsReceiptRewardRow } from './PointsReceiptRewardRow';

const rewardTypes = ['leaderboard_rank', 'sold_nfts', 'builder', 'optimism_new_scout_partner', 'optimism_top_referrer'];

export function PointsTable({
  pointsReceiptRewards,
  partnerRewards,
  title,
  emptyMessage
}: {
  pointsReceiptRewards: PointsReceiptReward[];
  title: ReactNode | string;
  partnerRewards: PartnerReward[];
  emptyMessage: string;
}) {
  const sortedRewards = useMemo(() => {
    return [...pointsReceiptRewards, ...partnerRewards].sort((a, b) => {
      if (a.type === 'season' || b.type === 'season') {
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
  }, [pointsReceiptRewards, partnerRewards]);

  if (sortedRewards.length === 0) {
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
          {sortedRewards.map((pointsReceiptReward) => (
            <PointsReceiptRewardRow
              key={`${pointsReceiptReward.type === 'season' ? pointsReceiptReward.season : pointsReceiptReward.week}-${pointsReceiptReward.type}`}
              pointsReceiptReward={pointsReceiptReward}
            />
          ))}
        </StyledTableBody>
      </Table>
    </Stack>
  );
}
