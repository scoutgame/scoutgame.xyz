import 'server-only';

import { Stack } from '@mui/material';
import { getMyDevelopersForMatchup } from '@packages/matchup/getMyDevelopersForMatchup';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { ErrorSSRMessage } from '@packages/scoutgame-ui/components/common/ErrorSSRMessage';

import { DevelopersGallery } from 'components/common/Gallery/DevelopersGallery';

import { AddDeveloperCard } from './AddDeveloperCard';
import { DevCardActionArea } from './DevCardActionArea';

export async function MyDeveloperCards({
  userId,
  matchupId,
  selectedDevelopers,
  selectedNfts
}: {
  userId: string;
  matchupId: string;
  selectedDevelopers: string[];
  selectedNfts: string[];
}) {
  const [error, scoutedDevelopers] = await safeAwaitSSRData(getMyDevelopersForMatchup({ scoutId: userId }));

  if (error) {
    return <ErrorSSRMessage />;
  }

  return (
    <Stack gap={1}>
      <DevelopersGallery
        builders={scoutedDevelopers}
        columns={4}
        scoutInView={userId}
        size='small'
        actionSlot={DevCardActionArea}
        actionSlotProps={{
          matchupId,
          selectedDevelopers,
          selectedNfts
        }}
        cardVariant='matchup_selection'
        firstItem={<AddDeveloperCard />}
      />
    </Stack>
  );
}
