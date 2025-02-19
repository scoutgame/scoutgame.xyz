'use client';

import { Stack, Table, TableCell, TableRow, Typography } from '@mui/material';
import type { BuilderReward } from '@packages/scoutgame/builders/getBuilderRewards';
import Link from 'next/link';
import { useDeveloperInfoModal } from 'providers/DeveloperInfoModalProvider';

import { Avatar } from '../../../common/Avatar';
import { PointsCell } from '../common/PointsCell';
import { StyledTableBody, StyledTableHead } from '../common/StyledTable';

function BuilderRewardsTableRow({ reward }: { reward: BuilderReward }) {
  const { openModal } = useDeveloperInfoModal();

  return (
    <TableRow>
      <TableCell>
        <Stack direction='row' alignItems='center' gap={1} onClick={() => openModal(reward.path)}>
          <Avatar src={reward.avatar} name={reward.path} size='small' />
          <Typography noWrap overflow='hidden'>
            {reward.displayName}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align='center'>
        <Typography>{reward.cardsHeld}</Typography>
      </TableCell>
      {reward.rank ? (
        <TableCell align='center'>
          <Typography>{reward.rank}</Typography>
        </TableCell>
      ) : null}
      <TableCell align='right'>
        <PointsCell points={reward.points} />
      </TableCell>
    </TableRow>
  );
}

export function BuilderRewardsTable({
  week,
  builderRewards,
  totalPoints
}: {
  week: string | null;
  builderRewards: BuilderReward[];
  totalPoints: number;
}) {
  return (
    <Table>
      <StyledTableHead>
        <TableRow>
          <TableCell align='left'>DEVELOPER</TableCell>
          <TableCell align='center'>CARDS HELD</TableCell>
          {week ? <TableCell align='center'>RANK</TableCell> : null}
          <TableCell align='right'>POINTS</TableCell>
        </TableRow>
      </StyledTableHead>
      <StyledTableBody
        sx={{
          '& .MuiTableCell-root': {
            width: !week ? '33.33%' : '25%'
          }
        }}
      >
        {builderRewards.map((reward) => (
          <BuilderRewardsTableRow key={reward.path} reward={reward} />
        ))}
        <TableRow>
          <TableCell colSpan={week ? 3 : 2}>
            <Typography>Total Scout Points</Typography>
          </TableCell>
          <TableCell align='right'>
            <PointsCell points={totalPoints} />
          </TableCell>
        </TableRow>
      </StyledTableBody>
    </Table>
  );
}
