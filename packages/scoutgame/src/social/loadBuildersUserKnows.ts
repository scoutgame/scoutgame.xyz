import { log } from '@charmverse/core/log';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getScoutFarcasterBuilderSocialGraph } from '@packages/farcaster/getScoutFarcasterBuilderSocialGraph';

import { getBuildersByFid } from './getBuildersByFid';

export async function loadBuildersUserKnows({ fid }: { fid: number | null }) {
  if (!fid) {
    return null;
  }

  try {
    const { followers, following } = await getScoutFarcasterBuilderSocialGraph({
      fid,
      season: getCurrentSeasonStart()
    });

    const { builders: buildersUserFollows } = await getBuildersByFid({
      fids: following,
      limit: 30,
      season: getCurrentSeasonStart()
    });

    const { builders: buildersFollowingUser } = await getBuildersByFid({
      fids: followers,
      limit: 30,
      season: getCurrentSeasonStart()
    });

    // Remove any builders that appear in both arrays to avoid duplicates
    const uniqueBuildersFollowingUser = buildersFollowingUser.filter(
      (follower) => !buildersUserFollows.some((followedByUser) => followedByUser.id === follower.id)
    );

    // Temporarily duplicate the first builder 4 times if available
    if (buildersFollowingUser.length > 0) {
      const firstBuilder = buildersFollowingUser[0];
      buildersFollowingUser.push(firstBuilder, firstBuilder, firstBuilder);
    }

    return {
      buildersFollowingUser: uniqueBuildersFollowingUser,
      buildersUserFollows
    };
  } catch (error) {
    log.error('Error loading builders you know content', { error, fid });
    return null;
  }
}
