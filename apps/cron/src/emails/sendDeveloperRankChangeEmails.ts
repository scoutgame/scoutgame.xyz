import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { sendEmailTemplate } from '@packages/mailer/sendEmailTemplate';
import type { Last14DaysRank } from '@packages/scoutgame/builders/interfaces';
import { baseUrl } from '@packages/utils/constants';
import { isTruthy } from '@packages/utils/types';

type MessageParams = {
  displayName: string;
  path: string;
  currentRank: number;
  previousRank: number;
};

const INTO_TOP_10_MESSAGES = [
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `🚀 <a href="${baseUrl}/u/${path}">${displayName}</a> rocketed from <strong>#${previousRank}</strong> to <strong style="color:#22c55e;">${currentRank}</strong> in the top 10!`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `⭐ <a href="${baseUrl}/u/${path}">${displayName}</a> leveled up from <strong>#${previousRank}</strong> to <strong style="color:#22c55e;">${currentRank}</strong>!`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `💻 <a href="${baseUrl}/u/${path}">${displayName}</a> coded their way from <strong>#${previousRank}</strong> to <strong style="color:#22c55e;">${currentRank}</strong>!`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `🎯 <a href="${baseUrl}/u/${path}">${displayName}</a> jumped from <strong>#${previousRank}</strong> to <strong style="color:#22c55e;">${currentRank}</strong>!`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `🌟 <a href="${baseUrl}/u/${path}">${displayName}</a> climbed from <strong>#${previousRank}</strong> to <strong style="color:#22c55e;">${currentRank}</strong>!`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `📈 <a href="${baseUrl}/u/${path}">${displayName}</a> rose from <strong>#${previousRank}</strong> to <strong style="color:#22c55e;">${currentRank}</strong>!`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `🔥 <a href="${baseUrl}/u/${path}">${displayName}</a> surged from <strong>#${previousRank}</strong> to <strong style="color:#22c55e;">${currentRank}</strong>!`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `🏆 <a href="${baseUrl}/u/${path}">${displayName}</a> advanced from <strong>#${previousRank}</strong> to <strong style="color:#22c55e;">${currentRank}</strong>!`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `⚡ <a href="${baseUrl}/u/${path}">${displayName}</a> shipped their way from <strong>#${previousRank}</strong> to <strong style="color:#22c55e;">${currentRank}</strong>!`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `🎉 <a href="${baseUrl}/u/${path}">${displayName}</a> moved up from <strong>#${previousRank}</strong> to <strong style="color:#22c55e;">${currentRank}</strong>!`
];

const OUT_OF_TOP_10_MESSAGES = [
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `<p style="font-family: 'Arial', sans-serif; color: #000;">🌅 <a href="${baseUrl}/u/${path}">${displayName}</a> moved from <strong>#${previousRank}</strong> to <strong style="color:#ef4444;">#${currentRank}</strong> - taking a breather</p>`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `<p style="font-family: 'Arial', sans-serif; color: #000;">📊 <a href="${baseUrl}/u/${path}">${displayName}</a> shifted from <strong>#${previousRank}</strong> to <strong style="color:#ef4444;">#${currentRank}</strong> as competition heats up</p>`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `<p style="font-family: 'Arial', sans-serif; color: #000;">🔄 <a href="${baseUrl}/u/${path}">${displayName}</a> moved from <strong>#${previousRank}</strong> to <strong style="color:#ef4444;">#${currentRank}</strong> - deep in development</p>`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `<p style="font-family: 'Arial', sans-serif; color: #000;">💡 <a href="${baseUrl}/u/${path}">${displayName}</a> went from <strong>#${previousRank}</strong> to <strong style="color:#ef4444;">#${currentRank}</strong> - planning phase?</p>`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `<p style="font-family: 'Arial', sans-serif; color: #000;">🎯 <a href="${baseUrl}/u/${path}">${displayName}</a> shifted from <strong>#${previousRank}</strong> to <strong style="color:#ef4444;">#${currentRank}</strong> - next feature incoming</p>`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `<p style="font-family: 'Arial', sans-serif; color: #000;">📝 <a href="${baseUrl}/u/${path}">${displayName}</a> moved from <strong>#${previousRank}</strong> to <strong style="color:#ef4444;">#${currentRank}</strong> - in code review</p>`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `<p style="font-family: 'Arial', sans-serif; color: #000;">🔍 <a href="${baseUrl}/u/${path}">${displayName}</a> changed from <strong>#${previousRank}</strong> to <strong style="color:#ef4444;">#${currentRank}</strong> - debugging time</p>`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `<p style="font-family: 'Arial', sans-serif; color: #000;">🌿 <a href="${baseUrl}/u/${path}">${displayName}</a> went from <strong>#${previousRank}</strong> to <strong style="color:#ef4444;">#${currentRank}</strong> - refactoring phase</p>`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `<p style="font-family: 'Arial', sans-serif; color: #000;">📚 <a href="${baseUrl}/u/${path}">${displayName}</a> moved from <strong>#${previousRank}</strong> to <strong style="color:#ef4444;">#${currentRank}</strong> - documentation sprint</p>`,
  ({ displayName, currentRank, previousRank, path }: MessageParams) =>
    `<p style="font-family: 'Arial', sans-serif; color: #000;">⚡ <a href="${baseUrl}/u/${path}">${displayName}</a> shifted from <strong>#${previousRank}</strong> to <strong style="color:#ef4444;">#${currentRank}</strong> - community is active!</p>`
];

function getRandomMessage(
  { displayName, currentRank, previousRank, path }: MessageParams,
  usedMessages: Set<number>
): string {
  const outOfTop10 = currentRank > 10;
  const messageTemplate = outOfTop10 ? OUT_OF_TOP_10_MESSAGES : INTO_TOP_10_MESSAGES;

  // Get available message indices that haven't been used
  const availableIndices = Array.from({ length: messageTemplate.length }, (_, i) => i).filter(
    (i) => !usedMessages.has(i)
  );

  // If all messages have been used, clear the set and use all indices
  if (availableIndices.length === 0) {
    usedMessages.clear();
    availableIndices.push(...Array.from({ length: messageTemplate.length }, (_, i) => i));
  }

  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  usedMessages.add(randomIndex);

  const message = messageTemplate[randomIndex]({
    displayName,
    currentRank,
    previousRank,
    path
  });

  return `<li>${message}</li>`;
}

function formatDevelopersSection(developers: MessageParams[], usedMessages: Set<number>): string {
  const intoTop10 = developers.filter((d) => d.currentRank <= 10);
  const outOfTop10 = developers.filter((d) => d.currentRank > 10);

  let html = '';

  if (intoTop10.length > 0) {
    html += `
      <h3 style="font-family: 'Arial', sans-serif;">🚀 Developers who broke into the top 10:</h3>
      <ul>
        ${intoTop10.map((dev) => getRandomMessage(dev, usedMessages)).join('\n')}
      </ul>
    `;
  }

  if (outOfTop10.length > 0) {
    html += `
      <h3 style="font-family: 'Arial', sans-serif;">💭 Developers taking a strategic pause:</h3>
      <ul>
        ${outOfTop10.map((dev) => getRandomMessage(dev, usedMessages)).join('\n')}
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
      id: '0643ef5f-da4d-4f08-990a-9b495eeb00dd',
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
        previousRank: number;
        currentRank: number;
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

          const [previousRank, currentRank] = builderLast2DaysRanks;
          if (previousRank <= cutoff && currentRank > cutoff) {
            // Builder moved out of top 10 today
            developers.push({
              builderId,
              previousRank,
              currentRank,
              path: scoutedNft.builderNft.builder.path,
              displayName: scoutedNft.builderNft.builder.displayName
            });
          } else if (previousRank > cutoff && currentRank <= cutoff) {
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
            developers_ranks: formatDevelopersSection(developers, new Set())
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
