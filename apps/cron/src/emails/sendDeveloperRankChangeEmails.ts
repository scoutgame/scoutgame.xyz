import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { sendEmailTemplate } from '@packages/mailer/sendEmailTemplate';
import { baseUrl } from '@packages/utils/constants';
import { isTruthy } from '@packages/utils/types';

export async function sendDeveloperRankChangeEmails({
  buildersRanksRecord
}: {
  buildersRanksRecord: Record<string, (number | null)[]>;
}) {
  const currentSeason = getCurrentSeasonStart();

  const scouts = await prisma.scout.findMany({
    where: {
      userSeasonStats: {
        some: {
          season: currentSeason,
          nftsPurchased: {
            gt: 0
          }
        }
      }
    },
    select: {
      id: true,
      wallets: {
        select: {
          scoutedNfts: {
            where: {
              builderNft: {
                season: currentSeason,
                // Only sending emails for default NFTs since starter packs can get noisy
                nftType: 'default'
              }
            },
            select: {
              builderNft: {
                select: {
                  builder: {
                    select: {
                      id: true,
                      displayName: true,
                      path: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  let emailsSent = 0;

  for (const scout of scouts) {
    try {
      const developers: {
        builderId: string;
        previousRank: number | null;
        rank: number;
        path: string;
        displayName: string;
      }[] = [];
      for (const wallet of scout.wallets) {
        for (const scoutedNft of wallet.scoutedNfts) {
          const builderId = scoutedNft.builderNft.builder.id;

          const builderLast2DaysRanks = buildersRanksRecord[builderId]?.slice(-2).filter(isTruthy);

          // Continue if we don't know whether the builder rank changed from yesterday
          if (builderLast2DaysRanks.length !== 2) {
            continue;
          }

          const [yesterdayRank, todayRank] = builderLast2DaysRanks;
          if (yesterdayRank <= 10 && todayRank > 10) {
            // Builder moved out of top 10 today
            developers.push({
              builderId,
              previousRank: yesterdayRank,
              rank: todayRank,
              path: scoutedNft.builderNft.builder.path,
              displayName: scoutedNft.builderNft.builder.displayName
            });
          } else if (yesterdayRank > 10 && todayRank <= 10) {
            // Builder moved into top 10 today
            developers.push({
              builderId,
              previousRank: yesterdayRank,
              rank: todayRank,
              path: scoutedNft.builderNft.builder.path,
              displayName: scoutedNft.builderNft.builder.displayName
            });
          }
        }
      }

      if (developers.length) {
        await sendEmailTemplate({
          senderAddress: `The Scout Game <updates@mail.scoutgame.xyz>`,
          subject: 'Your developers are on the move! 🚀',
          templateType: 'developer_rank_change',
          userId: scout.id,
          templateVariables: {
            developers_ranks: developers
              .map(
                (developer) =>
                  `${developer.displayName} (<a href="${baseUrl}/u/${developer.path}">${developer.path}</a>) moved from <strong>${developer.previousRank}</strong> to <strong>${developer.rank}</strong>`
              )
              .join('\n')
          }
        });
        emailsSent += 1;
      }
    } catch (error) {
      log.error('Error sending developer rank change email', { error, userId: scout.id });
    }
  }

  return emailsSent;
}
