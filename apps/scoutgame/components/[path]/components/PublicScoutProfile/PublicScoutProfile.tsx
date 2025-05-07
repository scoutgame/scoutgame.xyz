import 'server-only';

import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import type { ScoutProjectMinimal } from '@packages/scoutgame/projects/getUserScoutProjects';
import { findScoutOrThrow } from '@packages/scoutgame/scouts/findScoutOrThrow';
import { getScoutedBuilders } from '@packages/scoutgame/scouts/getScoutedBuilders';
import { getScoutStats } from '@packages/scoutgame/scouts/getScoutStats';
import { ErrorSSRMessage } from '@packages/scoutgame-ui/components/common/ErrorSSRMessage';
import type { BasicUserInfo } from '@packages/users/interfaces';

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

  const [scout, { allTimeTokens, seasonTokens, nftsPurchased }, scoutedBuilders] = data;

  return (
    <PublicScoutProfileContainer
      scout={{
        ...scout,
        githubLogin: scout.githubUsers[0]?.login
      }}
      allTimeTokens={allTimeTokens}
      seasonTokens={seasonTokens}
      nftsPurchased={nftsPurchased}
      scoutedBuilders={scoutedBuilders}
      scoutProjects={scoutProjects}
    />
  );
}
