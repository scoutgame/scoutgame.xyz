import 'server-only';

import AppsIcon from '@mui/icons-material/Apps';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { Box, Grid2 as Grid, Stack, Typography } from '@mui/material';
import type { BuildersSortBy } from '@packages/scoutgame/builders/getBuilders';
import { HeaderMessage } from '@packages/scoutgame-ui/components/common/Header/HeaderMessage';
import { LoadingCards } from '@packages/scoutgame-ui/components/common/Loading/LoadingCards';
import { LoadingTable } from '@packages/scoutgame-ui/components/common/Loading/LoadingTable';
import { TabsMenu, type TabItem } from '@packages/scoutgame-ui/components/common/Tabs/TabsMenu';
import { isTruthy } from '@packages/utils/types';
import Link from 'next/link';
import { Suspense } from 'react';

import { InfoModal } from './components/InfoModal';
import { ScoutPageCarouselContainer as ScoutPageCarousel } from './components/ScoutPageCarouselContainer';
import { ScoutPageDevelopersGallery } from './components/ScoutPageDevelopersGallery';
import { ScoutPageTable } from './components/ScoutPageTable/ScoutPageTable';
import { SearchDevelopersInput } from './components/SearchDevelopersInput';
import { WeeklyMatchupCallout } from './components/WeeklyMatchupCallout';

export const scoutTabOptions: TabItem[] = [{ label: 'Top Scouts', value: 'scouts' }];

export const scoutTabMobileOptions: TabItem[] = [{ label: 'Developers', value: 'builders' }, ...scoutTabOptions];

const nftTypeOptions = [
  { label: 'Standard', value: 'default' },
  { label: 'Starters', value: 'starter' }
];

export async function ScoutPage({
  scoutSort,
  builderSort,
  scoutOrder,
  builderOrder,
  scoutTab,
  buildersLayout,
  tab,
  nftType,
  userId
}: {
  scoutSort: string;
  builderSort: BuildersSortBy;
  scoutOrder: string;
  builderOrder: string;
  scoutTab: string;
  buildersLayout: string;
  tab: string;
  nftType: 'starter' | 'default';
  userId?: string;
}) {
  const urlString = Object.entries({ tab, scoutSort, builderSort, scoutOrder, builderOrder, nftType })
    .filter(([, value]) => isTruthy(value))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return (
    <>
      <HeaderMessage />
      <Grid
        container
        sx={{
          flexGrow: 1,
          overflow: 'hidden'
        }}
        data-test='scout-page'
      >
        <Grid
          size={{ xs: 12, md: 8 }}
          sx={{
            height: '100%',
            overflowX: 'hidden',
            p: 1,
            gap: 2
          }}
        >
          <TabsMenu value={nftType} tabs={nftTypeOptions} queryKey='nftType' sx={{ width: '100%' }} />
          <Suspense key='scout-page-carousel' fallback={<LoadingCards count={3} withTitle={true} />}>
            <ScoutPageCarousel nftType={nftType} />
          </Suspense>
          <Stack
            position='sticky'
            top={0}
            bgcolor='background.default'
            sx={{ display: { xs: 'none', md: 'flex' }, mt: 4 }}
          >
            <Typography color='secondary' textAlign='center' variant='h5'>
              Browse All Developers
            </Typography>
            <Stack
              sx={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                position: 'sticky',
                top: -20,
                zIndex: 1,
                gap: 2,
                backgroundColor: 'background.default',
                alignItems: 'center',
                py: 2,
                display: { xs: 'none', md: 'flex' }
              }}
            >
              <Stack flexDirection='row' alignItems='center' gap={1}>
                <Link href={`/scout?${urlString ? `${urlString}&` : ''}buildersLayout=table`}>
                  <FormatListBulletedIcon color={buildersLayout === 'table' ? 'secondary' : 'disabled'} />
                </Link>
                <Link href={`/scout?${urlString ? `${urlString}&` : ''}buildersLayout=gallery`}>
                  <AppsIcon color={buildersLayout === 'gallery' ? 'secondary' : 'disabled'} />
                </Link>
              </Stack>
              <SearchDevelopersInput sx={{ maxWidth: '500px' }} />
              <InfoModal builder />
            </Stack>
            <Suspense
              fallback={
                buildersLayout === 'table' ? (
                  <LoadingTable />
                ) : buildersLayout === 'gallery' ? (
                  <LoadingCards count={3} />
                ) : null
              }
            >
              {buildersLayout === 'table' && (
                <ScoutPageTable
                  tab='builders'
                  order={builderOrder}
                  sort={builderSort}
                  userId={userId}
                  nftType={nftType}
                />
              )}
              {buildersLayout === 'gallery' && <ScoutPageDevelopersGallery userId={userId} nftType={nftType} />}
            </Suspense>
          </Stack>
          <Stack position='sticky' top={0} bgcolor='background.default' sx={{ display: { xs: 'flex', md: 'none' } }}>
            <WeeklyMatchupCallout />
            <Box sx={{ position: 'absolute', right: 0, top: 3.5, zIndex: 2 }}>
              <InfoModal builder={tab === 'builders'} />
            </Box>
            <TabsMenu
              value={tab}
              tabs={scoutTabMobileOptions}
              queryKey='tab'
              sx={{ position: 'sticky', top: -20, zIndex: 1, backgroundColor: 'background.default' }}
            />
            <Suspense fallback={<LoadingTable />}>
              <ScoutPageTable
                tab={tab}
                order={tab === 'builders' ? builderOrder : scoutOrder}
                sort={tab === 'builders' ? builderSort : scoutSort}
                userId={userId}
                nftType={nftType}
              />
            </Suspense>
          </Stack>
        </Grid>
        <Grid
          size={4}
          sx={{
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: { xs: 'none', md: 'block' },
            px: 1
          }}
        >
          <Box sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'background.default' }}>
            <WeeklyMatchupCallout />
            <TabsMenu
              value={scoutTab}
              tabs={scoutTabOptions}
              queryKey='scoutTab'
              sx={{ position: 'relative' }}
              infoIcon={<InfoModal sx={{ position: 'absolute', right: 10, top: 3.5 }} />}
            />
          </Box>
          <Suspense fallback={<LoadingTable />}>
            <ScoutPageTable tab={scoutTab} order={scoutOrder} sort={scoutSort} userId={userId} nftType={nftType} />
          </Suspense>
        </Grid>
      </Grid>
    </>
  );
}
