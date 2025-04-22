import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  List,
  ListItem,
  ListItemText,
  Grid2 as Grid,
  Paper,
  Stack,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { isDraftEnabled, hasDraftEnded } from '@packages/scoutgame/drafts/checkDraftDates';
import type { DraftDeveloperSort } from '@packages/scoutgame/drafts/getDraftDevelopers';
import { HeaderMessage } from '@packages/scoutgame-ui/components/common/Header/HeaderMessage';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { LoadingCard } from '@packages/scoutgame-ui/components/common/Loading/LoadingCard';
import { LoadingTable } from '@packages/scoutgame-ui/components/common/Loading/LoadingTable';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import { DraftDevelopersTable } from './components/DraftDevelopersTable';
import { DraftSeasonOffersTable } from './components/DraftSeasonOffersTable';
import { SearchDraftDevelopers } from './components/SearchDraftDevelopers';

function DraftInfo({ isAccordion = false }: { isAccordion?: boolean }) {
  const content = (
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
        <Typography>Draft opens April 21st and runs through April 25th, UTC.</Typography>
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
            <ListItemText>
              <Typography color='green.main'>Losing bids are refunded.</Typography>
            </ListItemText>
          </ListItem>
          <ListItem sx={{ display: 'list-item', pl: 1, py: 0 }}>
            <ListItemText>Unsold cards go to marketplace.</ListItemText>
          </ListItem>
        </List>
      </Stack>
    </Stack>
  );

  const header = (
    <>
      <Hidden mdDown>
        <Stack flexDirection='row' gap={2} alignItems='center'>
          <Image height={75} width={75} src='/images/home/scout-sticker.png' alt='Scout Sticker' />
          <Typography variant='h4' color='secondary'>
            How the Draft Works
          </Typography>
        </Stack>
      </Hidden>
      <Hidden mdUp>
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <Image height={50} width={50} src='/images/home/scout-sticker.png' alt='Scout Sticker' />
          <Typography variant='h5' color='secondary'>
            How the Draft Works
          </Typography>
        </Stack>
      </Hidden>
    </>
  );

  if (isAccordion) {
    return (
      <Accordion defaultExpanded sx={{ borderRadius: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>{header}</AccordionSummary>
        <AccordionDetails>{content}</AccordionDetails>
      </Accordion>
    );
  }

  return (
    <Paper sx={{ flex: 1, borderRadius: 2, p: { xs: 1.5, md: 3 } }}>
      {header}
      {content}
    </Paper>
  );
}

export function DraftRegisterPage({ search, sort, tab }: { search?: string; sort?: DraftDeveloperSort; tab?: string }) {
  const draftEnabled = isDraftEnabled();
  const draftEnded = hasDraftEnded();

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
            {draftEnded
              ? 'Draft has ended'
              : draftEnabled
                ? 'Build your deck before the season begins!'
                : 'Draft has not started yet'}
          </Typography>
          <Hidden mdUp>
            <DraftInfo isAccordion />
          </Hidden>
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
          size={{ xs: 12, md: 4 }}
          sx={{
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: { xs: 'none', md: 'block' },
            px: 1,
            my: 2
          }}
        >
          <DraftInfo />
          <Suspense fallback={<LoadingCard />}>
            <DraftSeasonOffersTable />
          </Suspense>
        </Grid>
      </Grid>
    </>
  );
}
