import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { IconButton, Stack, Typography } from '@mui/material';
import {
  getLastWeek,
  getCurrentSeason,
  getPreviousWeek,
  getNextWeek,
  getSeasonWeekFromISOWeek
} from '@packages/dates/utils';
import Link from 'next/link';
import { Suspense } from 'react';

import { LoadingTable } from '../../../common/Loading/LoadingTable';
import { TabsMenu } from '../../../common/Tabs/TabsMenu';

import { BuilderRewardsTableContainer } from './BuilderRewardsTableContainer';

export function BuilderRewardsScreen({ period }: { period: string }) {
  const currentSeason = getCurrentSeason();
  const isSeason = period === 'season';
  const lastWeek = getLastWeek();
  const week = isSeason ? null : period || lastWeek;
  const previousWeek = week ? (week === currentSeason.start ? null : getPreviousWeek(week)) : null;
  const nextWeek = week ? (week === lastWeek ? null : getNextWeek(week)) : null;

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
        <Link href={previousWeek ? `/claim?tab=${previousWeek}` : ''}>
          <IconButton disabled={!previousWeek} size='small'>
            <ChevronLeftIcon />
          </IconButton>
        </Link>
        <Typography>
          {!week ? `${currentSeason.title}` : `Week ${getSeasonWeekFromISOWeek({ season: currentSeason.start, week })}`}
        </Typography>
        <Link href={nextWeek ? `/claim?tab=${nextWeek}` : ''}>
          <IconButton disabled={!nextWeek} size='small'>
            <ChevronRightIcon />
          </IconButton>
        </Link>
      </Stack>
      <Suspense fallback={<LoadingTable />}>
        <BuilderRewardsTableContainer week={week} />
      </Suspense>
    </Stack>
  );
}
