import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getAllISOWeeksFromSeasonStart, getDateFromISOWeek } from '@packages/dates/utils';
import { uuidFromNumber } from '@packages/utils/uuid';

export type GemReceiptInput = {
  isoWeek: string;
  value: number;
  date: Date;
};

export type DeterministicRandomBuilderActivity = {
  id: string;
  totalGems: number;
  firstActiveWeek: string;
  activeWeeks: string[];
  gemReceiptInputs: GemReceiptInput[];
};

export function seedBuilders({
  season,
  amount = 200,
  indexOffset = 0
}: {
  season: ISOWeek;
  amount?: number;
  indexOffset?: number;
}): {
  builders: DeterministicRandomBuilderActivity[];
  weeks: ISOWeek[];
} {
  const weeks = getAllISOWeeksFromSeasonStart({ season });

  // Setup X builders (default 200) using a deterministic uuid per builder index
  // Create mock builders with random gem distributions
  const builders: DeterministicRandomBuilderActivity[] = Array.from({ length: amount }, (_, index) => {
    const baseIndex = index + indexOffset;

    // Use deterministic seed based on builder index, but with more variation
    const seed = (baseIndex * 17 + 31) % 997; // Using prime numbers for better distribution

    // Generate random total gems between 500-5000
    const totalGems = Math.floor(((seed % 45) + 5) * 100);

    // Generate random start week between W02-W10
    const firstWeekIndex = seed % weeks.length;
    const firstActiveWeek = weeks[firstWeekIndex];

    // Calculate active weeks from firstActiveWeek until last week
    const activeWeeks = weeks.slice(weeks.indexOf(firstActiveWeek));

    // Distribute gems across active weeks
    let gemsDistributed = 0;
    const gemReceiptInputs: GemReceiptInput[] = activeWeeks.map((week, weekIndex) => {
      // Use deterministic random distribution based on seed and week
      const weekSeed = (seed * (weekIndex + 1) + 41) % 1009; // Different prime for variation

      // Calculate remaining gems and weeks
      const remainingWeeks = activeWeeks.length - weekIndex;
      const gemsLeft = totalGems - gemsDistributed;

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

    return {
      id: uuidFromNumber(baseIndex),
      totalGems,
      firstActiveWeek,
      activeWeeks,
      gemReceiptInputs
    };
  });

  return { builders, weeks };
}

export async function writeSeededBuildersToDatabase({
  builders,
  season
}: {
  builders: DeterministicRandomBuilderActivity[];
  season: ISOWeek;
}) {
  await prisma.scout.createMany({
    data: builders.map((builder) => ({
      id: builder.id,
      displayName: `Builder ${builder.id}`,
      path: `p-${builder.id}`,
      referralCode: `r-${builder.id}`
    }))
  });

  await prisma.builderNft.createMany({
    data: builders.map((builder, index) => ({
      builderId: builder.id,
      chainId: 10,
      contractAddress: `0x${season}`,
      // add variability
      createdAt: new Date(Date.now() + index * 10000 * Math.random()),
      tokenId: index + 1,
      currentPriceDevToken: String(20 * 10 ** 18),
      currentPrice: BigInt(20),
      imageUrl: `https://example.com/image-${index}.png`,
      season
    }))
  });

  for (let i = 0; i < builders.length; i++) {
    const builder = builders[i];
    for (let j = 0; j < builder.gemReceiptInputs.length; j++) {
      const gemReceipt = builder.gemReceiptInputs[j];

      await prisma.builderEvent.create({
        data: {
          season,
          week: gemReceipt.isoWeek,
          type: 'daily_commit',
          createdAt: getDateFromISOWeek(gemReceipt.isoWeek).toJSDate(),
          gemsReceipt: {
            create: {
              createdAt: getDateFromISOWeek(gemReceipt.isoWeek).toJSDate(),
              type: 'daily_commit',
              value: gemReceipt.value
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
