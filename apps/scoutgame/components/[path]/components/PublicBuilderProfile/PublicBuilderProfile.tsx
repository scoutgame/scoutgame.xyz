import 'server-only';

import { getBuilderActivities } from '@packages/scoutgame/builders/getBuilderActivities';
import { getBuilderCardStats } from '@packages/scoutgame/builders/getBuilderCardStats';
import { getBuilderNft } from '@packages/scoutgame/builders/getBuilderNft';
import { getBuilderScouts } from '@packages/scoutgame/builders/getBuilderScouts';
import { getBuilderStats } from '@packages/scoutgame/builders/getBuilderStats';
import { getDeveloperNftListings } from '@packages/scoutgame/nftListing/getNftListings';
import type { ScoutProjectMinimal } from '@packages/scoutgame/projects/getUserScoutProjects';

import type { BuilderProfileProps } from './PublicBuilderProfileContainer';
import { PublicBuilderProfileContainer } from './PublicBuilderProfileContainer';

export async function PublicBuilderProfile({
  builder,
  loggedInUserId,
  scoutProjects
}: {
  builder: Omit<BuilderProfileProps['builder'], 'nftsSoldToLoggedInScout' | 'starterNftSoldToLoggedInScout'>;
  loggedInUserId?: string;
  scoutProjects?: ScoutProjectMinimal[];
}) {
  const builderId = builder.id;

  const [
    defaultNft,
    starterPackNft,
    { allTimePoints = 0, seasonPoints = 0, rank = 0, gemsCollected = 0 },
    builderActivities,
    { scouts = [], totalNftsSold = 0, totalScouts = 0 },
    { level, estimatedPayout, last14DaysRank, nftsSoldToLoggedInScout, starterNftSoldToLoggedInScout },
    nftListings
  ] = await Promise.all([
    getBuilderNft(builderId),
    getBuilderNft(builderId, 'starter_pack'),
    getBuilderStats(builderId),
    getBuilderActivities({ builderId, limit: 200 }),
    getBuilderScouts(builderId),
    getBuilderCardStats({ builderId, loggedInScoutId: loggedInUserId }),
    getDeveloperNftListings(builderId)
  ]);

  return (
    <PublicBuilderProfileContainer
      scouts={scouts}
      builder={{
        ...builder,
        gemsCollected,
        nftsSoldToLoggedInScout,
        last14DaysRank: last14DaysRank ?? [],
        level: level ?? 0,
        listings: nftListings,
        estimatedPayout: estimatedPayout ?? 0
      }}
      starterNftSoldToLoggedInScout={starterNftSoldToLoggedInScout}
      defaultNft={defaultNft}
      starterPackNft={starterPackNft}
      allTimePoints={allTimePoints}
      seasonPoints={seasonPoints}
      totalScouts={totalScouts}
      totalNftsSold={totalNftsSold}
      builderActivities={builderActivities}
      gemsCollected={gemsCollected}
      rank={rank}
      scoutProjects={scoutProjects}
    />
  );
}
