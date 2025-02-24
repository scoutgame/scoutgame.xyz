import 'server-only';

import { prisma } from '@charmverse/core/prisma-client';
import { Card, Stack, Typography } from '@mui/material';
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
    <Stack direction='row' spacing={2} mt={2}>
      <MetricCard title='Total Repos' value={repos} />
      <MetricCard title='Total PRs' value={totalPoints} />
      <MetricCard title='Unique Builders' value={uniqueBuilders} />
    </Stack>
  );
}

function MetricCard({ title, value, decimals = 0 }: { title: string; value: number; decimals?: number }) {
  return (
    <Card sx={{ p: 2, minWidth: 150 }}>
      <Typography variant='subtitle2' color='text.secondary'>
        {title}
      </Typography>
      <Typography variant='h6'>
        {value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })}
      </Typography>
    </Card>
  );
}
