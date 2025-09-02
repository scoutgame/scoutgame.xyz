import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { IconButton, Stack, Typography } from '@mui/material';
import {
  getLastWeek,
  getPreviousWeek,
  getSeasonConfig,
  getNextWeek,
  getCurrentSeasonWeekNumber,
  getPreviousSeason,
  getNextSeason,
  getCurrentSeason,
  getPreviousNonDraftSeason
} from '@packages/dates/utils';
import { LoadingTable } from '@packages/scoutgame-ui/components/common/Loading/LoadingTable';
import { TabsMenu } from '@packages/scoutgame-ui/components/common/Tabs/TabsMenu';
import Link from 'next/link';
import { Suspense } from 'react';

import { DeveloperRewardsTableContainer } from './DeveloperRewardsTableContainer';

export function DeveloperRewardsScreen({
  period,
  season,
  claimedSeason
}: {
  period: string;
  season: string;
  claimedSeason?: string;
}) {
  const currentSeason = getSeasonConfig(season);
  const isSeason = period === 'season';
  const lastSeason = getPreviousNonDraftSeason(season);
  const nextSeason = getNextSeason(season);
  const lastWeek = getLastWeek();
  const week = isSeason ? null : period || lastWeek;
  const previousWeek = week ? (week === season ? null : getPreviousWeek(week)) : null;
  const nextWeek = week ? (week === lastWeek ? null : getNextWeek(week)) : null;
  const weekSeason = week ? getCurrentSeason(week) : null;
  const previousSeasonSearchParams = new URLSearchParams();
  const nextSeasonSearchParams = new URLSearchParams();

  if (isSeason) {
    if (lastSeason) {
      previousSeasonSearchParams.set('season', lastSeason);
      previousSeasonSearchParams.set('tab', 'season');
      if (claimedSeason) {
        previousSeasonSearchParams.set('claimedSeason', claimedSeason);
      }
    } else if (nextSeason) {
      nextSeasonSearchParams.set('season', nextSeason);
      nextSeasonSearchParams.set('tab', 'season');
      if (claimedSeason) {
        nextSeasonSearchParams.set('claimedSeason', claimedSeason);
      }
    }
  }

  const previousWeekSearchParams = new URLSearchParams();

  if (previousWeek) {
    previousWeekSearchParams.set('tab', previousWeek);
    if (claimedSeason) {
      previousWeekSearchParams.set('claimedSeason', claimedSeason);
    }
  }

  const nextWeekSearchParams = new URLSearchParams();

  if (nextWeek) {
    nextWeekSearchParams.set('tab', nextWeek);
    if (claimedSeason) {
      nextWeekSearchParams.set('claimedSeason', claimedSeason);
    }
  }

  const previousLink =
    isSeason && previousSeasonSearchParams.size
      ? `/claim?${previousSeasonSearchParams.toString()}`
      : previousWeek && previousWeekSearchParams.size
        ? `/claim?${previousWeekSearchParams.toString()}`
        : '';
  const nextLink =
    isSeason && nextSeasonSearchParams.size
      ? `/claim?${nextSeasonSearchParams.toString()}`
      : nextWeek && nextWeekSearchParams.size
        ? `/claim?${nextWeekSearchParams.toString()}`
        : '';

  return (
    <Stack gap={1} pt={1} alignItems='center'>
      <Typography color='secondary' variant='h6'>
        Developer Rewards
      </Typography>
      <Typography textAlign='center'>See how many DEV Tokens your Developers have earned for you!</Typography>
      <TabsMenu
        tabs={[
          { value: week || lastWeek, label: 'Weekly' },
          { value: 'season', label: 'Season Total' }
        ]}
        value={isSeason ? 'season' : week || lastWeek}
      />
      <Stack direction='row' gap={1} alignItems='center'>
        <Link href={previousLink}>
          <IconButton disabled={!previousLink} size='small'>
            <ChevronLeftIcon />
          </IconButton>
        </Link>
        <Typography>
          {!week
            ? `${currentSeason.title}`
            : `Week ${getCurrentSeasonWeekNumber(week)}${weekSeason && currentSeason.start !== weekSeason.start ? ` (${weekSeason?.title})` : ''}`}
        </Typography>
        <Link href={nextLink}>
          <IconButton disabled={!nextLink} size='small'>
            <ChevronRightIcon />
          </IconButton>
        </Link>
      </Stack>
      <Suspense fallback={<LoadingTable />}>
        <DeveloperRewardsTableContainer week={week} season={season} />
      </Suspense>
    </Stack>
  );
}
