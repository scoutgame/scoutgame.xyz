import 'server-only';

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
  TableContainer
} from '@mui/material';
import { getWeekFromDate, getAllISOWeeksFromSeasonStart } from '@packages/dates/utils';
import type { BonusPartner } from '@packages/scoutgame/bonus';

const currentSeasonWeeks = getAllISOWeeksFromSeasonStart();

type WeeklyStat = {
  week: string;
  prs: number;
  builders: Set<string>;
};

export async function GithubMetrics({ partner }: { partner: BonusPartner }) {
  const [repos, builderEvents] = await Promise.all([
    prisma.githubRepo.count({
      where: {
        bonusPartner: partner
      }
    }),
    prisma.builderEvent.findMany({
      where: {
        bonusPartner: partner
      },
      select: {
        createdAt: true,
        builder: {
          select: {
            id: true
          }
        }
      }
    })
  ]);
  // generate weekly stats based on the builderEvents
  const weeklyStats = builderEvents.reduce<Record<string, WeeklyStat>>((acc, event) => {
    const week = getWeekFromDate(event.createdAt);
    acc[week] = acc[week] || { week, prs: 0, builders: new Set(), uniqueBuilders: 0 };
    acc[week].prs += 1;
    acc[week].builders.add(event.builder.id);
    return acc;
  }, {});

  const allBuilders = new Set(builderEvents.map((event) => event.builder.id));

  const weeklyStatsArray = Object.values(weeklyStats).sort((a, b) => (b.week < a.week ? -1 : 1));
  return (
    <Card>
      <Stack direction='row' alignItems='flex-start' p={2}>
        <Box flexGrow={1}>
          <Typography variant='h6' sx={{ mt: 0, mb: 3 }}>
            Github Activity
          </Typography>
          <Stack direction='row' gap={1}>
            <MetricCard
              title='Repositories'
              value={
                <>
                  {repos.toLocaleString()}{' '}
                  {/* <Chip label='View' size='small' variant='outlined' color='secondary' clickable sx={{ ml: 1 }} /> */}
                </>
              }
            />

            {/* <MetricCard title='Total paid' value={`${toEth(totalPayouts)} ${tokenSymbol}`} /> */}
          </Stack>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <TableContainer sx={{ maxHeight: '200px' }}>
            <Table stickyHeader size='small'>
              <TableHead>
                <TableRow sx={{ '.MuiTableCell-root': { backgroundColor: 'background.paper' } }}>
                  <TableCell>Week</TableCell>
                  <TableCell align='right'>Builders</TableCell>
                  <TableCell align='right'>PRs</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {weeklyStatsArray.map((weeklyStat) => {
                  return (
                    <TableRow key={weeklyStat.week}>
                      <TableCell>
                        {currentSeasonWeeks.indexOf(weeklyStat.week) > -1
                          ? currentSeasonWeeks.indexOf(weeklyStat.week) + 1
                          : '-'}
                      </TableCell>
                      <TableCell align='right'>{weeklyStat.builders.size}</TableCell>
                      <TableCell align='right'>{weeklyStat.prs}</TableCell>
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
                    borderTop: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <TableCell>Total</TableCell>
                  <TableCell align='right'>{allBuilders.size}</TableCell>
                  <TableCell align='right'>
                    {weeklyStatsArray.reduce((sum, weeklyStat) => sum + weeklyStat.prs, 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
    </Card>
  );
}

function MetricCard({ title, value }: { title: string; value: number | React.ReactNode }) {
  return (
    <Box minWidth={135}>
      <Typography variant='subtitle2' color='text.secondary'>
        {title}
      </Typography>
      <Typography variant='h6'>{typeof value === 'number' ? value.toLocaleString() : value}</Typography>
    </Box>
  );
}
