import { List, ListItem, ListItemText, Grid2 as Grid, Paper, Stack, Typography, Chip } from '@mui/material';
import type { DraftDeveloperSort } from '@packages/scoutgame/drafts/getDraftDevelopers';
import { HeaderMessage } from '@packages/scoutgame-ui/components/common/Header/HeaderMessage';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { LoadingCard } from '@packages/scoutgame-ui/components/common/Loading/LoadingCard';
import { LoadingTable } from '@packages/scoutgame-ui/components/common/Loading/LoadingTable';
import { DateTime } from 'luxon';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import { DraftDevelopersTable } from './components/DraftDevelopersTable';
import { DraftSeasonOffersTable } from './components/DraftSeasonOffersTable';
import { SearchDraftDevelopers } from './components/SearchDraftDevelopers';

const DRAFT_END_DATE = DateTime.fromISO('2025-04-25T23:59:59.999Z', { zone: 'utc' });

export function DraftRegisterPage({ search, sort, tab }: { search?: string; sort?: DraftDeveloperSort; tab?: string }) {
  const draftEnded = DateTime.utc() > DRAFT_END_DATE;

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
            mt: 2,
            gap: {
              xs: 1,
              md: 4
            },
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography variant='h4' color='secondary' textAlign='center'>
            {draftEnded ? 'Draft has ended' : 'Build your deck before the season begins!'}
          </Typography>
          <SearchDraftDevelopers />
          <Stack
            flexDirection='row'
            gap={{
              xs: 1,
              md: 2
            }}
            alignItems='center'
          >
            <Link href='/draft/register?sort=all'>
              <Chip
                sx={{
                  borderRadius: 1,
                  fontSize: {
                    xs: '0.8rem',
                    md: '1rem'
                  }
                }}
                label='All Developers'
                variant={sort === 'all' && tab === undefined ? 'filled' : 'outlined'}
                color='primary'
              />
            </Link>
            <Link href='/draft/register?sort=trending'>
              <Chip
                sx={{
                  borderRadius: 1,
                  fontSize: {
                    xs: '0.8rem',
                    md: '1rem'
                  }
                }}
                label='Trending'
                variant={sort === 'trending' && tab === undefined ? 'filled' : 'outlined'}
                color='primary'
              />
            </Link>
            <Hidden mdUp>
              <Link href='/draft/register?tab=your-bids'>
                <Chip
                  sx={{
                    borderRadius: 1,
                    fontSize: {
                      xs: '0.8rem',
                      md: '1rem'
                    }
                  }}
                  label='Your Bids'
                  variant={tab === 'your-bids' ? 'filled' : 'outlined'}
                  color='primary'
                />
              </Link>
            </Hidden>
          </Stack>
          <Suspense fallback={<LoadingTable />}>
            {tab === 'your-bids' ? <DraftSeasonOffersTable /> : <DraftDevelopersTable search={search} sort={sort} />}
          </Suspense>
        </Grid>
        <Grid
          size={4}
          sx={{
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: { xs: 'none', md: 'block' },
            px: 1,
            my: 2
          }}
        >
          <Paper sx={{ flex: 1, borderRadius: 2, p: { xs: 2, md: 3 } }}>
            <Stack flexDirection='row' gap={2} alignItems='center'>
              <Image height={75} width={75} src='/images/home/scout-sticker.png' alt='Scout Sticker' />
              <Typography variant='h4' color='secondary'>
                How the Draft Works
              </Typography>
            </Stack>
            <Stack gap={1}>
              <Stack>
                <Typography variant='h6' fontWeight={600} color='secondary'>
                  Bidding
                </Typography>
                <Typography>
                  Only the top 50 bids for each developer win a Developer Card. Minimum bid is 100 DEV tokens.
                </Typography>
              </Stack>

              <Stack>
                <Typography variant='h6' fontWeight={600} color='secondary'>
                  Timeline
                </Typography>
                <Typography>Draft opens April 21st and runs through April 27th, UTC.</Typography>
              </Stack>

              <Stack>
                <Typography variant='h6' fontWeight={600} color='secondary'>
                  After the Draft
                </Typography>
                <Typography>On the opening day of Season 1, April 28th:</Typography>
                <List sx={{ listStyleType: 'disc', pl: 2 }}>
                  <ListItem sx={{ display: 'list-item', pl: 1, py: 0 }}>
                    <ListItemText>Winning bids receive Developer Cards.</ListItemText>
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', pl: 1, py: 0 }}>
                    <ListItemText>Losing bids are refunded.</ListItemText>
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', pl: 1, py: 0 }}>
                    <ListItemText>Unsold cards go to marketplace.</ListItemText>
                  </ListItem>
                </List>
              </Stack>
            </Stack>
          </Paper>
          <Suspense fallback={<LoadingCard />}>
            <DraftSeasonOffersTable />
          </Suspense>
        </Grid>
      </Grid>
    </>
  );
}
