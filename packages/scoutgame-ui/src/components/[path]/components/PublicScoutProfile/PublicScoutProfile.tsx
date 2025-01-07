import 'server-only';

import { findScoutOrThrow } from '@packages/scoutgame/scouts/findScoutOrThrow';
import { getScoutedBuilders } from '@packages/scoutgame/scouts/getScoutedBuilders';
import { getScoutStats } from '@packages/scoutgame/scouts/getScoutStats';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';
import type { BasicUserInfo } from '@packages/users/interfaces';

import { ErrorSSRMessage } from '../../../common/ErrorSSRMessage';

import { PublicScoutProfileContainer } from './PublicScoutProfileContainer';

export async function PublicScoutProfile({ publicUser }: { publicUser: BasicUserInfo }) {
  const allPromises = [
    findScoutOrThrow(publicUser.id),
    getScoutStats(publicUser.id),
    getScoutedBuilders({ scoutId: publicUser.id })
  ] as const;
  const [error, data] = await safeAwaitSSRData(Promise.all(allPromises));

  if (error) {
    return <ErrorSSRMessage />;
  }

  const [scout, { allTimePoints, seasonPoints, nftsPurchased }, scoutedBuilders] = data;

  return (
    <PublicScoutProfileContainer
      scout={{
        ...scout,
        githubLogin: scout.githubUsers[0]?.login
      }}
      allTimePoints={allTimePoints}
      seasonPoints={seasonPoints}
      nftsPurchased={nftsPurchased}
      scoutedBuilders={scoutedBuilders}
    />
  );
}
