import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { IconButton, Stack, Typography } from '@mui/material';
import {
  getLastWeek,
  getPreviousWeek,
  getSeasonConfig,
  getNextWeek,
  getSeasonWeekFromISOWeek,
  getPreviousSeason,
  getNextSeason
} from '@packages/dates/utils';
import Link from 'next/link';
import { Suspense } from 'react';

import { LoadingTable } from '../../../common/Loading/LoadingTable';
import { TabsMenu } from '../../../common/Tabs/TabsMenu';

import { BuilderRewardsTableContainer } from './BuilderRewardsTableContainer';

export function BuilderRewardsScreen({ period, season }: { period: string; season: string }) {
  const currentSeason = getSeasonConfig(season);
  const isSeason = period === 'season';
  const lastSeason = getPreviousSeason(season);
  const nextSeason = getNextSeason(season);
  const lastWeek = getLastWeek();
  const week = isSeason ? null : period || lastWeek;
  const previousWeek = week ? (week === season ? null : getPreviousWeek(week)) : null;
  const nextWeek = week ? (week === lastWeek ? null : getNextWeek(week)) : null;
  const previousLink =
    (isSeason && lastSeason && `/claim?tab=season&season=${lastSeason}`) ||
    (previousWeek && lastWeek && `/claim?tab=${previousWeek}`) ||
    '';
  const nextLink =
    (isSeason && nextSeason && `/claim?tab=season&season=${nextSeason}`) ||
    (nextWeek && `/claim?tab=${nextWeek}`) ||
    '';

  return (
    <Stack gap={1} pt={1} alignItems='center'>
      <Typography color='secondary' variant='h6'>
        Developer Rewards
      </Typography>
      <Typography textAlign='center'>See how many Scout Points your Developers have earned for you!</Typography>
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
          {!week ? `${currentSeason.title}` : `Week ${getSeasonWeekFromISOWeek({ season: currentSeason.start, week })}`}
        </Typography>
        <Link href={nextLink}>
          <IconButton disabled={!nextLink} size='small'>
            <ChevronRightIcon />
          </IconButton>
        </Link>
      </Stack>
      <Suspense fallback={<LoadingTable />}>
        <BuilderRewardsTableContainer week={week} season={season} />
      </Suspense>
    </Stack>
  );
}
