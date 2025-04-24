import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { recordNftMint } from '@packages/scoutgame/builderNfts/recordNftMint';
import { getWeekFromDate } from '@packages/dates/utils';
import { DateTime } from 'luxon';
import { BuilderInfo } from './generateSeedData';
import { randomTimeOfDay } from './generator';
import { randomIntFromInterval } from '@packages/testing/generators';

export async function generateNftPurchaseEvents(
  scoutId: string,
  assignedBuilders: Pick<BuilderInfo, 'builderNftId' | 'nftPrice'>[],
  date: DateTime
) {
  if (assignedBuilders.length === 0) {
    return 0;
  }
  const week = getWeekFromDate(date.toJSDate());
  let totalNftsPurchasedToday = 0;
  for (let nftCount = 0; nftCount < faker.number.int({ min: 0, max: 3 }); nftCount++) {
    const builder = faker.helpers.arrayElement(assignedBuilders);
    const createdAt = randomTimeOfDay(date).toJSDate();
    if (builder.builderNftId && builder.nftPrice) {
      const nftsPurchased = faker.number.int({ min: 1, max: 5 });
      totalNftsPurchasedToday += nftsPurchased;
      await prisma.$transaction(async (tx) => {
        const builderNftId = builder.builderNftId as string;
        const nftPrice = builder.nftPrice as number;
        const pointsValue = Number(nftPrice * nftsPurchased) / 10 ** 6;

        await tx.builderNft.update({
          where: {
            id: builder.builderNftId
          },
          data: {
            currentPrice: Math.ceil(nftPrice + nftPrice * 0.1)
          }
        });

        await recordNftMint({
          builderNftId,
          amount: nftsPurchased,
          paidWithPoints: false,
          pointsValue,
          mintTxHash: faker.finance.ethereumAddress(),
          recipientAddress: faker.finance.ethereumAddress(),
          createdAt,
          skipMixpanel: true,
          skipPriceRefresh: true,
          mintTxLogIndex: randomIntFromInterval(0, 100)
        });
      });
    }
  }

  return totalNftsPurchasedToday;
}
