import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getAllISOWeeksFromSeasonStart, getDateFromISOWeek } from '@packages/dates/utils';
import { mockBuilder } from '@packages/testing/database';
import { uuidFromNumber } from '@packages/utils/uuid';

export type GemPayoutInput = {
  isoWeek: string;
  value: number;
  date: Date;
};

export type DeterministicRandomBuilderGemsPayoutActivity = {
  id: string;
  totalPoints: number;
  firstActiveWeek: string;
  activeWeeks: string[];
  gemPayoutInputs: GemPayoutInput[];
};

export function seedBuildersGemPayouts({
  season,
  amount = 200,
  indexOffset = 0
}: {
  season: ISOWeek;
  amount?: number;
  indexOffset?: number;
}): {
  builders: DeterministicRandomBuilderGemsPayoutActivity[];
  weeks: ISOWeek[];
} {
  const allWeeks = getAllISOWeeksFromSeasonStart({ season });
  const weeks = allWeeks.slice(0, -1);

  // Setup X builders (default 200) using a deterministic uuid per builder index
  // Create mock builders with random gem distributions
  const builders: DeterministicRandomBuilderGemsPayoutActivity[] = Array.from({ length: amount }, (_, index) => {
    const baseIndex = index + indexOffset;

    // Use deterministic seed based on builder index, but with more variation
    const seed = (baseIndex * 17 + 31) % 997; // Using prime numbers for better distribution

    // Generate random total gems between 500-5000
    const totalPoints = Math.floor(((seed % 45) + 5) * 100);

    // Generate random start week between W02-W10
    const firstWeekIndex = seed % weeks.length;
    let firstActiveWeek = weeks[firstWeekIndex];

    // Calculate active weeks from firstActiveWeek until last week
    let activeWeeks = weeks.slice(weeks.indexOf(firstActiveWeek));

    // Distribute gems across active weeks
    let gemsDistributed = 0;
    let gemPayoutInputs: GemPayoutInput[] = activeWeeks.map((week, weekIndex) => {
      // Use deterministic random distribution based on seed and week
      const weekSeed = (seed * (weekIndex + 1) + 41) % 1009; // Different prime for variation

      // Calculate remaining gems and weeks
      const remainingWeeks = activeWeeks.length - weekIndex;
      const gemsLeft = totalPoints - gemsDistributed;

      // For last week, use all remaining gems
      if (weekIndex === activeWeeks.length - 1) {
        const value = gemsLeft;
        gemsDistributed += value;
        return { isoWeek: week, value, date: getDateFromISOWeek(week).toJSDate() };
      }

      // Distribute gems based on remaining weeks
      const portion = (weekSeed % 31) / (100 * remainingWeeks); // Scale portion by remaining weeks
      const value = Math.floor(gemsLeft * portion);
      gemsDistributed += value;

      const date = getDateFromISOWeek(week);
      date.plus({ days: 2 });
      return { isoWeek: week, value, date: date.toJSDate() };
    });

    // Filter out gem payouts with 0 points and get first non-zero payout week
    const firstNonZeroPayout = gemPayoutInputs.find((payout) => payout.value > 0);

    if (firstNonZeroPayout) {
      // Update firstActiveWeek and activeWeeks to start from first non-zero payout
      const firstActiveWeekIndex = activeWeeks.indexOf(firstNonZeroPayout.isoWeek);
      firstActiveWeek = activeWeeks[firstActiveWeekIndex];
      activeWeeks = activeWeeks.slice(firstActiveWeekIndex);

      // Filter gemPayoutInputs to only include weeks from first non-zero payout
      gemPayoutInputs = gemPayoutInputs.slice(firstActiveWeekIndex);
    }

    return {
      id: uuidFromNumber(baseIndex),
      totalPoints,
      firstActiveWeek,
      activeWeeks,
      gemPayoutInputs
    };
  });

  return { builders, weeks };
}

export async function writeSeededBuildersGemPayoutsToDatabase({
  builders,
  season
}: {
  builders: DeterministicRandomBuilderGemsPayoutActivity[];
  season: ISOWeek;
}) {
  const _builders = await Promise.all(
    builders.map((builder) =>
      mockBuilder({
        id: builder.id,
        createNft: true,
        nftSeason: season
      })
    )
  );
  const scouts = _builders.slice(0, 10);

  for (let i = 0; i < builders.length; i++) {
    const builder = builders[i];
    for (let j = 0; j < builder.gemPayoutInputs.length; j++) {
      const gemPayout = builder.gemPayoutInputs[j];

      await prisma.builderEvent.create({
        data: {
          season,
          week: gemPayout.isoWeek,
          type: 'gems_payout',
          createdAt: getDateFromISOWeek(gemPayout.isoWeek).toJSDate(),
          tokensReceipts: {
            createMany: {
              data: scouts.map((scout) => ({
                value: BigInt(gemPayout.value).toString(),
                recipientWalletAddress: scout.wallets[0].address
              }))
            }
          },
          builder: {
            connect: {
              id: builder.id
            }
          }
        }
      });
    }
  }
}
