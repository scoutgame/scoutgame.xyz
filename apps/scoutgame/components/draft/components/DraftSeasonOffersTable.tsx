import { Stack, Typography } from '@mui/material';
import type { DraftDeveloper } from '@packages/scoutgame/drafts/getDraftDevelopers';

import { DevelopersTable } from './DevelopersTable';

export async function DraftSeasonOffersTable({ draftDevelopers }: { draftDevelopers: DraftDeveloper[] }) {
  const developerScoutBids = draftDevelopers
    .flatMap((developer) =>
      developer.scoutBids.map((bid) => ({
        bidAmount: bid.value,
        createdAt: bid.createdAt,
        ...developer
      }))
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <Stack my={2} gap={1}>
      <Typography
        textAlign='center'
        variant='h6'
        color='text.secondary'
        fontWeight={600}
        sx={{
          display: {
            xs: 'none',
            md: 'block'
          }
        }}
      >
        Your Bids
      </Typography>
      <DevelopersTable draftDevelopers={developerScoutBids} hideHeader />
    </Stack>
  );
}
