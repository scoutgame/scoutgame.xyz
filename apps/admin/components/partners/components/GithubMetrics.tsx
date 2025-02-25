import 'server-only';

import { prisma } from '@charmverse/core/prisma-client';
import { Box, Card, Stack, Typography } from '@mui/material';
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
        <Typography variant='h6' sx={{ mt: 0, flexGrow: 1 }}>
          Github
        </Typography>
        <Stack direction='row'>
          <MetricCard title='Total PRs' value={totalPoints} />
          <MetricCard title='Active Repos' value={repos} />
          <MetricCard title='Unique Builders' value={uniqueBuilders} />
        </Stack>
      </Stack>
    </Card>
  );
}

function MetricCard({ title, value, decimals = 0 }: { title: string; value: number; decimals?: number }) {
  return (
    <Box minWidth={150}>
      <Typography variant='subtitle2' color='text.secondary'>
        {title}
      </Typography>
      <Typography variant='h6'>
        {value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })}
      </Typography>
    </Box>
  );
}
