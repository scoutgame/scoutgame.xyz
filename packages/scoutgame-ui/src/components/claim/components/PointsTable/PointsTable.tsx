'use client';

import { Paper, Stack, Table, TableCell, TableRow, Typography } from '@mui/material';
import { getCurrentSeasonWeekNumber, getLastWeek } from '@packages/dates/utils';
import type { PointsReceiptReward } from '@packages/scoutgame/points/getPointsReceiptsRewards';
import type { ReactNode } from 'react';

import { StyledTableBody, StyledTableHead } from '../common/StyledTable';

import { PointsReceiptRewardRow } from './PointsReceiptRewardRow';

export function PointsTable({
  pointsReceiptRewards,
  title,
  emptyMessage,
  processingPayouts
}: {
  pointsReceiptRewards: PointsReceiptReward[];
  title: ReactNode | string;
  emptyMessage: string;
  processingPayouts: boolean;
}) {
  // Don't show rewards for previous week if processing payouts
  const filteredReceipts = processingPayouts
    ? pointsReceiptRewards.filter((r) => (r.type !== 'season' ? r.week !== getCurrentSeasonWeekNumber() - 1 : true))
    : pointsReceiptRewards;

  if (filteredReceipts.length === 0) {
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
          {filteredReceipts.map((pointsReceiptReward) => (
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
