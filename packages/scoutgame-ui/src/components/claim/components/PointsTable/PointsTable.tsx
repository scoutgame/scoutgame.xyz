'use client';

import { Paper, Stack, Table, TableCell, TableRow, Typography } from '@mui/material';
import type { PartnerReward } from '@packages/scoutgame/points/getPartnerRewards';
import type { PointsReceiptReward } from '@packages/scoutgame/points/getPointsReceiptsRewards';
import { useMemo, type ReactNode } from 'react';

import { StyledTableBody, StyledTableHead } from '../common/StyledTable';

import { PointsReceiptRewardRow } from './PointsReceiptRewardRow';

const getTypeOrder = (type: string): number => {
  switch (type) {
    case 'leaderboard_rank':
      return 0;
    case 'sold_nfts':
      return 1;
    case 'builder':
      return 2;
    case 'optimism_new_scout_partner':
      return 3;
    case 'optimism_top_referrer':
      return 4;
    default:
      return 5;
  }
};

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
        const typeOrderA = getTypeOrder(a.type);
        const typeOrderB = getTypeOrder(b.type);
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
