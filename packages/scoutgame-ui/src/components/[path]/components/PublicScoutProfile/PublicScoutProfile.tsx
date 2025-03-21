import 'server-only';

import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import type { ScoutProjectMinimal } from '@packages/scoutgame/projects/getUserScoutProjects';
import { findScoutOrThrow } from '@packages/scoutgame/scouts/findScoutOrThrow';
import { getScoutedBuilders } from '@packages/scoutgame/scouts/getScoutedBuilders';
import { getScoutStats } from '@packages/scoutgame/scouts/getScoutStats';
import type { BasicUserInfo } from '@packages/users/interfaces';

import { ErrorSSRMessage } from '../../../common/ErrorSSRMessage';

import { PublicScoutProfileContainer } from './PublicScoutProfileContainer';

export async function PublicScoutProfile({
  publicUser,
  loggedInUserId,
  scoutProjects
}: {
  publicUser: BasicUserInfo;
  loggedInUserId?: string;
  scoutProjects?: ScoutProjectMinimal[];
}) {
  const allPromises = [
    findScoutOrThrow(publicUser.id),
    getScoutStats(publicUser.id),
    getScoutedBuilders({ scoutIdInView: publicUser.id, loggedInScoutId: loggedInUserId })
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
      scoutProjects={scoutProjects}
    />
  );
}
