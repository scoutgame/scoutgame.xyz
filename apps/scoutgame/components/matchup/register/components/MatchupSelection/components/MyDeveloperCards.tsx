import 'server-only';

import { Stack } from '@mui/material';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getScoutedBuilders } from '@packages/scoutgame/scouts/getScoutedBuilders';
import { ErrorSSRMessage } from '@packages/scoutgame-ui/components/common/ErrorSSRMessage';

import { DevelopersGallery } from 'components/common/Gallery/DevelopersGallery';

import { AddDeveloperCard } from './AddDeveloperCard';
import { DevCardActionArea } from './DevCardActionArea';

export async function MyDeveloperCards({
  userId,
  matchupId,
  selectedDevelopers
}: {
  userId: string;
  matchupId: string;
  selectedDevelopers: string[];
}) {
  const [error, scoutedBuilders] = await safeAwaitSSRData(
    getScoutedBuilders({ loggedInScoutId: userId, scoutIdInView: userId })
  );

  if (error) {
    return <ErrorSSRMessage />;
  }

  return (
    <Stack gap={1}>
      <DevelopersGallery
        builders={scoutedBuilders}
        columns={4}
        scoutInView={userId}
        size='small'
        actionSlot={DevCardActionArea}
        actionSlotProps={{
          matchupId,
          selectedDevelopers
        }}
        cardVariant='matchup_selection'
        firstItem={<AddDeveloperCard />}
      />
    </Stack>
  );
}
