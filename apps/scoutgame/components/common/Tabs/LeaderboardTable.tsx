'use client';

import type { Theme } from '@mui/material';
import { Box, Button, Stack, TableHead, Typography, useMediaQuery } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Image from 'next/image';
import * as React from 'react';

import { Avatar } from '../Avatar';

export function LeaderboardTable({
  data
}: {
  data: {
    user: { avatar: string; username: string };
    progress: number;
    gems: number;
    price: number;
  }[];
}) {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  return (
    <TableContainer component={Paper} sx={{ pt: 2 }}>
      <Table aria-label='Leaderboard table' size='small'>
        <TableHead>
          <TableRow>
            {isMobile ? (
              <TableCell colSpan={4}>SEASON 1 WEEK 1 DAY 1</TableCell>
            ) : (
              <>
                <TableCell>RANK</TableCell>
                <TableCell>BUILDER</TableCell>
                <TableCell>SEASON 1 WEEK 1 DAY 1</TableCell>
                <TableCell>Gems this week</TableCell>
                <TableCell />
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={row.user.username}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                '& .MuiTableCell-root': { p: '6px', borderBottom: '1px solid', borderBottomColor: 'background.default' }
              }}
            >
              <TableCell scope='row'>
                <Typography color={index + 1 <= 3 ? 'text.secondary' : undefined}>{index + 1}</Typography>
              </TableCell>
              <TableCell component='th' scope='row' sx={{ maxWidth: { xs: '150px', md: '100%' } }}>
                <Stack alignItems='center' flexDirection='row' gap={1}>
                  <Avatar src={row.user.avatar} name={row.user.username} size='small' />
                  <Typography variant='caption' noWrap>
                    {row.user.username}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell sx={{ maxWidth: { xs: '100px', sm: '100%' } }}>
                <Box
                  sx={{
                    background:
                      'linear-gradient(90deg, #A06CD5 0%, #9C74D8 7%, #908DE1 29%, #85A5EA 50%, #79BCF3 71%, #72CBF8 84.5%, #69DDFF 100%)',
                    height: '10px',
                    borderTopRightRadius: '10px',
                    borderBottomRightRadius: '10px',
                    width: { xs: `${row.progress || 0}px`, md: `${row.progress || 0}%` }
                  }}
                />
              </TableCell>
              <TableCell sx={{ maxWidth: '100px' }}>
                <Stack flexDirection='row' gap={0.2} alignItems='center' justifyContent='flex-end'>
                  <Typography variant='caption'>{row.gems}</Typography>
                  <Image width={15} height={15} src='/images/profile/icons/hex-gem-icon.svg' alt='Gem' />
                </Stack>
              </TableCell>
              {!isMobile && (
                <TableCell>
                  <Button variant='buy'>${row.price || 0}</Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
