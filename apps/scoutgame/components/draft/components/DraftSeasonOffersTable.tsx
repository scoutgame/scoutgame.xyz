import { Stack, Typography } from '@mui/material';
import { getSession } from '@packages/nextjs/session/getSession';
import { getDraftSeasonOffers } from '@packages/scoutgame/drafts/getDraftSeasonOffers';

import { DevelopersTable } from './DevelopersTable';

export async function DraftSeasonOffersTable() {
  const session = await getSession();
  const draftSeasonOffers = session?.scoutId ? await getDraftSeasonOffers({ scoutId: session.scoutId }) : [];

  if (draftSeasonOffers.length === 0) {
    return null;
  }

  return (
    <Stack my={2} gap={1}>
      <Typography textAlign='center' variant='h6' color='text.secondary' fontWeight={600}>
        Your Bids
      </Typography>
      <DevelopersTable draftDevelopers={draftSeasonOffers} hideHeader />
    </Stack>
  );
}
