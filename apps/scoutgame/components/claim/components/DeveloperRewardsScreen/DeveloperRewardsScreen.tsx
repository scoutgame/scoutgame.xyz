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
  getCurrentSeason
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
  const lastSeason = getPreviousSeason(season);
  const nextSeason = getNextSeason(season);
  const lastWeek = getLastWeek();
  const week = isSeason ? null : period || lastWeek;
  const previousWeek = week ? (week === season ? null : getPreviousWeek(week)) : null;
  const nextWeek = week ? (week === lastWeek ? null : getNextWeek(week)) : null;
  const weekSeason = week ? getCurrentSeason(week) : null;
  const urlSearchParams = new URLSearchParams();

  if (isSeason) {
    if (lastSeason) {
      urlSearchParams.set('season', lastSeason);
      urlSearchParams.set('tab', 'season');
      if (claimedSeason) {
        urlSearchParams.set('claimedSeason', claimedSeason);
      }
    } else if (nextSeason) {
      urlSearchParams.set('season', nextSeason);
      urlSearchParams.set('tab', 'season');
      if (claimedSeason) {
        urlSearchParams.set('claimedSeason', claimedSeason);
      }
    }
  }

  if (previousWeek) {
    if (lastWeek) {
      urlSearchParams.set('tab', previousWeek);
      if (claimedSeason) {
        urlSearchParams.set('claimedSeason', claimedSeason);
      }
    }
  }

  if (nextWeek) {
    urlSearchParams.set('tab', nextWeek);
    if (claimedSeason) {
      urlSearchParams.set('claimedSeason', claimedSeason);
    }
  }

  const previousLink = previousWeek ? `/claim?${urlSearchParams.toString()}` : '';
  const nextLink = nextWeek ? `/claim?${urlSearchParams.toString()}` : '';

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
