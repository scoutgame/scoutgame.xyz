import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { sendEmailTemplate } from '@packages/mailer/sendEmailTemplate';
import { baseUrl } from '@packages/utils/constants';

type MessageParams = {
  displayName: string;
  path: string;
  currentRank: number;
  previousRank: number | null;
};

const SUCCESS_COLOR = '#22c55e';
const ERROR_COLOR = '#ef4444';
const TEXT_COLOR = '#000000';
const LINK_COLOR = '#3a3a3a';
const FONT_FAMILY = 'Arial, sans-serif';

const INTO_TOP_10_MESSAGES_PARTS = [
  {
    emoji: '🚀',
    filler: 'rocketed from'
  },
  {
    emoji: '⭐',
    filler: 'leveled up from'
  },
  {
    emoji: '💻',
    filler: 'coded their way from'
  },
  {
    emoji: '🎯',
    filler: 'jumped from'
  },
  {
    emoji: '🌟',
    filler: 'climbed from'
  },
  {
    emoji: '📈',
    filler: 'rose from'
  },
  {
    emoji: '🔥',
    filler: 'surged from'
  },
  {
    emoji: '🏆',
    filler: 'advanced from'
  },
  {
    emoji: '⚡',
    filler: 'shipped their way from'
  }
];

const OUT_OF_TOP_10_MESSAGES_PARTS = [
  {
    emoji: '🌅',
    suffix: 'taking a breather'
  },
  {
    emoji: '📊',
    suffix: 'as competition heats up'
  },
  {
    emoji: '🔄',
    suffix: 'deep in development'
  },
  {
    emoji: '💡',
    suffix: 'planning phase?'
  },
  {
    emoji: '🎯',
    suffix: 'next feature incoming'
  },
  {
    emoji: '📝',
    suffix: 'in code review'
  },
  {
    emoji: '🔍',
    suffix: 'debugging time'
  },
  { emoji: '🌿', suffix: 'refactoring phase' },
  {
    emoji: '📚',
    suffix: 'documentation sprint'
  },
  {
    emoji: '⚡',
    suffix: 'community is active!'
  }
];

function getOutOfTop10Message({ displayName, currentRank, previousRank, path }: MessageParams): string {
  const { emoji, suffix } =
    OUT_OF_TOP_10_MESSAGES_PARTS[Math.floor(Math.random() * OUT_OF_TOP_10_MESSAGES_PARTS.length)];
  return `<p style="font-family: ${FONT_FAMILY}; color: ${TEXT_COLOR};">${emoji} <a href="${baseUrl}/u/${path}" style="color: ${LINK_COLOR};">${displayName}</a> moved from <strong>#${previousRank}</strong> to <strong style="color:${ERROR_COLOR};">#${currentRank}</strong> - ${suffix}</p>`;
}

function getIntoTop10Message({ displayName, currentRank, previousRank, path }: MessageParams): string {
  const { emoji, filler } = INTO_TOP_10_MESSAGES_PARTS[Math.floor(Math.random() * INTO_TOP_10_MESSAGES_PARTS.length)];
  return `<p style="font-family: ${FONT_FAMILY}; color: ${TEXT_COLOR};">${emoji} <a href="${baseUrl}/u/${path}" style="color: ${LINK_COLOR};">${displayName}</a> ${previousRank === null ? `moved directly to` : `${filler} <strong>#${previousRank}</strong> to`} <strong style="color:${SUCCESS_COLOR};">#${currentRank}</strong></p>`;
}

function getRandomMessage(messageParams: MessageParams): string {
  const message =
    messageParams.currentRank > 10 ? getOutOfTop10Message(messageParams) : getIntoTop10Message(messageParams);

  return `<li>${message}</li>`;
}

function formatDevelopersSection(developers: MessageParams[]): string {
  const intoTop10 = developers.filter((d) => d.currentRank <= 10);
  const outOfTop10 = developers.filter((d) => d.currentRank > 10);

  let html = '';

  if (intoTop10.length > 0) {
    html += `
      <h3 style="font-family: ${FONT_FAMILY};">🚀 Developers who broke into the top 10:</h3>
      <ul>
        ${intoTop10.map((dev) => getRandomMessage(dev)).join('\n')}
      </ul>
    `;
  }

  if (outOfTop10.length > 0) {
    html += `
      <h3 style="font-family: ${FONT_FAMILY}; padding-top: 20px;">💭 Developers who dropped out of the top 10:</h3>
      <ul>
        ${outOfTop10.map((dev) => getRandomMessage(dev)).join('\n')}
      </ul>
    `;
  }

  return html;
}

const cutoff = 10;

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
      displayName: true,
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
        currentRank: number;
        path: string;
        displayName: string;
      }[] = [];
      for (const wallet of scout.wallets) {
        for (const scoutedNft of wallet.scoutedNfts) {
          const builderId = scoutedNft.builderNft.builder.id;

          const builderLast2DaysRanks = buildersRanksRecord[builderId]?.slice(-2);

          // Continue if we don't know whether the builder rank changed from yesterday
          if (builderLast2DaysRanks.length !== 2) {
            continue;
          }

          const [previousRank, currentRank] = builderLast2DaysRanks;
          if (previousRank && currentRank && previousRank <= cutoff && currentRank > cutoff) {
            // Builder moved out of top 10 today
            developers.push({
              builderId,
              previousRank,
              currentRank,
              path: scoutedNft.builderNft.builder.path,
              displayName: scoutedNft.builderNft.builder.displayName
            });
          } else if ((previousRank === null || previousRank > cutoff) && currentRank && currentRank <= cutoff) {
            // Builder moved into top 10 today
            developers.push({
              builderId,
              previousRank,
              currentRank,
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
            scout_name: scout.displayName,
            developers_ranks: formatDevelopersSection(developers)
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
