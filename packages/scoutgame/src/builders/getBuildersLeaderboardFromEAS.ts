import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { scoutGameAttestationChainId } from '@packages/scoutgameattestations/constants';
import type { ScoutGameAttestation } from '@packages/scoutgameattestations/queries/fetchAttestations';
import { fetchAttestations } from '@packages/scoutgameattestations/queries/fetchAttestations';

import type { LeaderboardBuilder } from './getBuildersLeaderboard';

export async function getBuildersLeaderboardFromEAS({
  quantity,
  week,
  season
}: {
  quantity?: number;
  week: string;
  season?: string;
}): Promise<LeaderboardBuilder[]> {
  season ||= getCurrentSeasonStart(week);

  // Load up all builder status events for the season
  const seasonBuilderEvents = await fetchAttestations({
    season,
    chainId: scoutGameAttestationChainId,
    type: 'developerStatusEvent'
  }).then((events) =>
    events.reduce(
      (acc, event) => {
        const refUID = event.refUID;

        // Don't process empty events
        if (!refUID) {
          log.warn('No refUID found for builder status event', { event });
          return acc;
        }

        if (!acc[refUID]) {
          acc[refUID] = [];
        }
        acc[refUID].push(event);
        return acc;
      },
      {} as Record<`0x${string}`, typeof events>
    )
  );

  const validRefUIDs: `0x${string}`[] = [];

  // Make sure the builder is registered and not banned
  for (const [refUID, events] of Object.entries(seasonBuilderEvents)) {
    const hasRegistered = events.some((event) => event.content.type === 'registered');

    if (hasRegistered) {
      // Sort events from most recent to oldest
      const sortedEvents = [...events].sort((a, b) => b.timeCreated - a.timeCreated);

      let isBanned = false;
      // Get the most recent ban/unban event to determine current status
      const lastBanEvent = sortedEvents.find(
        (event) => event.content.type === 'banned' || event.content.type === 'unbanned'
      );
      isBanned = lastBanEvent?.content.type === 'banned';

      if (!isBanned) {
        validRefUIDs.push(refUID as `0x${string}`);
      }
    }
  }

  const builderHistory: Record<`0x${string}`, ScoutGameAttestation<'contributionReceipt'>[]> = {};

  // Load up the history for the builder
  for (const refUID of validRefUIDs) {
    const builderContributions = await fetchAttestations({
      userRefUID: refUID,
      chainId: scoutGameAttestationChainId,
      type: 'contributionReceipt',
      week
    });

    builderHistory[refUID] = builderContributions;
  }

  // Calculate total value for each builder from their contributions
  const builderValues: Record<`0x${string}`, number> = {};

  for (const [refUID, contributions] of Object.entries(builderHistory)) {
    const builderEvents = seasonBuilderEvents[refUID as `0x${string}`];
    const sortedEvents = [...builderEvents].sort((a, b) => b.timeCreated - a.timeCreated);

    // Find all ban/unban events
    const statusEvents = sortedEvents.filter(
      (event) => event.content.type === 'banned' || event.content.type === 'unbanned'
    );

    builderValues[refUID as `0x${string}`] = contributions.reduce((total, contribution) => {
      // Skip revoked attestations
      if (contribution.revoked) {
        return total;
      }

      // For each contribution, check if it was made during a banned period
      let isBannedAtContributionTime = false;

      // Sort status events by time to track ban/unban sequence
      const sortedStatusEvents = [...statusEvents].sort((a, b) => a.timeCreated - b.timeCreated);

      for (const statusEvent of sortedStatusEvents) {
        if (contribution.timeCreated >= statusEvent.timeCreated) {
          isBannedAtContributionTime = statusEvent.content.type === 'banned';
        }
      }

      if (isBannedAtContributionTime) {
        return total;
      }

      return total + contribution.content.value;
    }, 0);
  }

  // Create ranked list sorted by total value
  const rankedBuilders = Object.entries(builderValues)
    .map(([refUID, value]) => ({
      refUID: refUID as `0x${string}`,
      value
    }))
    .sort((a, b) => {
      // Sort by value descending
      if (b.value !== a.value) {
        return b.value - a.value;
      }
      // If values are equal, sort by refUID for consistent ordering
      return a.refUID.localeCompare(b.refUID);
    });

  const buildersFromDb = await prisma.scout.findMany({
    where: {
      onchainProfileAttestationChainId: scoutGameAttestationChainId,
      onchainProfileAttestationUid: {
        in: rankedBuilders.map((builder) => builder.refUID)
      }
    },
    select: {
      id: true,
      path: true,
      displayName: true,
      onchainProfileAttestationUid: true
    }
  });

  const topBuilders = rankedBuilders
    .map((builder, index) => {
      const builderFromDb = buildersFromDb.find((b) => b.onchainProfileAttestationUid === builder.refUID);

      if (!builderFromDb) {
        return null;
      }

      return {
        builder: {
          id: builderFromDb.id,
          path: builderFromDb.path,
          displayName: builderFromDb.displayName
        },
        gemsCollected: builder.value,
        rank: index + 1
      };
    })
    .filter((builder): builder is LeaderboardBuilder => builder !== null);

  if (quantity) {
    return topBuilders.slice(0, quantity);
  }

  return topBuilders;
}
