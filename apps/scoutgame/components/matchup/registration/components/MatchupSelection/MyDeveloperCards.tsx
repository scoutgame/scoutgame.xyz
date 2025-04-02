import 'server-only';

import { Stack } from '@mui/material';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { getScoutedBuilders } from '@packages/scoutgame/scouts/getScoutedBuilders';
import { ErrorSSRMessage } from '@packages/scoutgame-ui/components/common/ErrorSSRMessage';

import { BuildersGallery } from 'components/common/Gallery/BuildersGallery';

import { ActionSlot } from './Action';

export async function MyDeveloperCards({
  userId,
  onSelectDeveloper
}: {
  userId: string;
  onSelectDeveloper?: (developerId: string) => void;
}) {
  const [error, scoutedBuilders] = await safeAwaitSSRData(
    getScoutedBuilders({ loggedInScoutId: userId, scoutIdInView: userId })
  );

  if (error) {
    return <ErrorSSRMessage />;
  }

  return (
    <Stack gap={1}>
      <BuildersGallery
        showListButton
        builders={scoutedBuilders}
        columns={4}
        scoutInView={userId}
        size='small'
        actionSlot={ActionSlot}
      />
    </Stack>
  );
}
