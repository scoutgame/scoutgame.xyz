import 'server-only';

import { prisma } from '@charmverse/core/prisma-client';
import { Box, Chip, Card, Stack, Typography } from '@mui/material';
import type { BonusPartner } from '@packages/scoutgame/bonus';

export async function GithubMetrics({ partner }: { partner: BonusPartner }) {
  const [repos, totalPoints, uniqueBuilders] = await Promise.all([
    prisma.githubRepo.count({
      where: {
        bonusPartner: partner
      }
    }),
    prisma.builderEvent.count({
      where: {
        bonusPartner: partner
      }
    }),
    prisma.builderEvent
      .findMany({
        where: {
          bonusPartner: partner
        },
        select: {
          builderId: true
        },
        distinct: ['builderId']
      })
      .then((builders) => builders.length)
  ]);

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
                  {repos}{' '}
                  <Chip label='View' size='small' variant='outlined' color='secondary' clickable sx={{ ml: 1 }} />
                  <Chip label='+ Add' size='small' variant='outlined' color='primary' clickable sx={{ ml: 1 }} />
                </>
              }
            />

            {/* <MetricCard title='Total paid' value={`${toEth(totalPayouts)} ${tokenSymbol}`} /> */}
          </Stack>
        </Box>
        <Stack direction='row' gap={1}>
          <MetricCard title='Total PRs' value={totalPoints} />
          <MetricCard title='Unique Builders' value={uniqueBuilders} />
        </Stack>
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
