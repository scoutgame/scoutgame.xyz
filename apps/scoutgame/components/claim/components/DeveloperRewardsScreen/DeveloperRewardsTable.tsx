'use client';

import { Stack, Table, TableCell, TableRow, Typography } from '@mui/material';
import type { DeveloperReward } from '@packages/scoutgame/builders/getDeveloperRewards';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import Link from 'next/link';

import { useGlobalModal } from 'components/common/ModalProvider';

import { StyledTableBody, StyledTableHead } from '../common/StyledTable';
import { TokensCell } from '../common/TokensCell';

function DeveloperRewardsTableRow({ reward }: { reward: DeveloperReward }) {
  const { openModal } = useGlobalModal();

  return (
    <TableRow>
      <TableCell>
        <Stack
          direction='row'
          alignItems='center'
          gap={1}
          onClick={(e) => {
            e.preventDefault();
            openModal('developerInfo', { path: reward.path });
          }}
          component={Link}
          href={`/u/${reward.path}`}
        >
          <Avatar src={reward.avatar} name={reward.path} size='small' />
          <Typography noWrap overflow='hidden'>
            {reward.displayName}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align='center'>
        <Typography>{reward.cardsHeld}</Typography>
      </TableCell>
      <TableCell align='center'>{reward.rank ? <Typography>{reward.rank}</Typography> : '-'}</TableCell>

      <TableCell align='right'>
        <TokensCell tokens={reward.tokens} />
      </TableCell>
    </TableRow>
  );
}

export function DeveloperRewardsTable({
  developerRewards,
  totalTokens
}: {
  developerRewards: DeveloperReward[];
  totalTokens: number;
}) {
  return (
    <Table>
      <StyledTableHead>
        <TableRow>
          <TableCell align='left'>DEVELOPER</TableCell>
          <TableCell align='center'>CARDS HELD</TableCell>
          <TableCell align='center'>RANK</TableCell>
          <TableCell align='right'>TOKENS</TableCell>
        </TableRow>
      </StyledTableHead>
      <StyledTableBody
        sx={{
          '& .MuiTableCell-root': {
            width: '25%'
          }
        }}
      >
        {developerRewards.map((reward) => (
          <DeveloperRewardsTableRow key={`${reward.path}-${reward.rank}`} reward={reward} />
        ))}
        <TableRow>
          <TableCell colSpan={3}>
            <Typography>Total DEV Tokens</Typography>
          </TableCell>
          <TableCell align='right'>
            <TokensCell tokens={totalTokens} />
          </TableCell>
        </TableRow>
      </StyledTableBody>
    </Table>
  );
}
