import { log } from '@charmverse/core/log';
import type { PartnerRewardPayout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import { sendNotifications } from '@packages/scoutgame/notifications/sendNotifications';
import { partnerRewardRecord } from '@packages/scoutgame/partnerRewards/constants';
import { getClaimableTokens } from '@packages/scoutgame/tokens/getClaimableTokens';
import { ceilToPrecision } from '@packages/utils/numbers';
import { DateTime } from 'luxon';
import { formatUnits } from 'viem';

const fontFamily = 'Arial, sans-serif';
const fontColor = '#000';
const linkColor = '#3a3a3a';

function formatPartnerRewardPayout(
  openingStatement: string,
  wallets: {
    partnerRewardPayouts: Pick<PartnerRewardPayout, 'amount'>[] &
      {
        payoutContract: {
          partner: string;
          tokenDecimals: number;
        };
      }[];
  }[]
) {
  if (wallets.length === 0) {
    return '';
  }

  let html = `<p style="padding-top: 5px; font-family: ${fontFamily}; color: ${fontColor};">${openingStatement}:</p><ul>`;
  for (const wallet of wallets) {
    for (const payout of wallet.partnerRewardPayouts) {
      const partner = partnerRewardRecord[payout.payoutContract.partner as keyof typeof partnerRewardRecord];
      if (partner) {
        html += `<li style="font-family: ${fontFamily}; color: ${fontColor};"><strong>${formatUnits(BigInt(payout.amount), payout.payoutContract.tokenDecimals)}</strong> <img style="width: 16px; height: 16px; vertical-align: -2px;" src="https://scoutgame.xyz${partner.icon}"/> from ${partner.partnerLink ? `<a style="text-decoration: underline; color: ${linkColor};" href="${partner.partnerLink}">${partner.label}</a>` : partner.label}</li>`;
      }
    }
  }
  return `${html}</ul>`;
}

function formatNewDevelopers(developers: { displayName: string; path: string }[]) {
  if (developers.length === 0) {
    return '';
  }

  let html = `<p style="font-family: ${fontFamily}; color: ${fontColor};">🔥 Want to scout some developers early? Here are some new developers who just joined the game:</p><ul style="font-family: ${fontFamily}; color: ${fontColor};">`;
  for (const dev of developers) {
    html += `<li><a style="text-decoration: underline; color: ${linkColor};" href="https://scoutgame.xyz/u/${dev.path}">${dev.displayName}</a></li>`;
  }
  html += '</ul>';

  return html;
}

export async function sendGemsPayoutNotifications({ week }: { week: string }) {
  const weekNumber = getCurrentSeasonWeekNumber(week);
  const lastWeekStart = DateTime.now().minus({ weeks: 1 }).startOf('week');
  const lastWeekEnd = DateTime.now().minus({ weeks: 1 }).endOf('week');

  const scouts = await prisma.scout.findMany({
    where: {
      deletedAt: null
    },
    select: {
      id: true,
      displayName: true,
      wallets: {
        where: {
          partnerRewardPayouts: {
            some: {
              deletedAt: null,
              payoutContract: {
                week
              }
            }
          }
        },
        select: {
          partnerRewardPayouts: {
            where: {
              deletedAt: null,
              payoutContract: {
                week
              }
            },
            select: {
              amount: true,
              payoutContract: {
                select: {
                  tokenDecimals: true,
                  partner: true
                }
              }
            }
          }
        }
      }
    }
  });

  let totalEmailsSent = 0;

  const newDevelopers = await prisma.scout.findMany({
    where: {
      createdAt: {
        gte: lastWeekStart.toJSDate(),
        lte: lastWeekEnd.toJSDate()
      }
    },
    select: {
      id: true,
      displayName: true,
      path: true
    },
    take: 3,
    orderBy: {
      createdAt: 'desc'
    }
  });

  for (const scout of scouts) {
    try {
      const weeklyClaimableTokens = await getClaimableTokens({ userId: scout.id, week });
      const claimableTokens = ceilToPrecision(weeklyClaimableTokens, 4);
      if (claimableTokens) {
        await sendNotifications({
          userId: scout.id,
          email: {
            templateVariables: {
              name: scout.displayName,
              points: claimableTokens,
              partner_rewards: formatPartnerRewardPayout(
                'You have also earned these partner rewards this week',
                scout.wallets
              )
            }
          },
          farcaster: {
            templateVariables: {
              tokens: claimableTokens
            }
          },
          app: {
            templateVariables: {
              tokens: claimableTokens
            }
          },
          notificationType: 'weekly_claim'
        });
      } else {
        await sendNotifications({
          userId: scout.id,
          notificationType: 'zero_weekly_claim',
          email: {
            templateVariables: {
              name: scout.displayName,
              partner_rewards: formatPartnerRewardPayout(
                'You have earned these partner rewards this week',
                scout.wallets
              ),
              season: getCurrentSeasonStart(),
              week_num: weekNumber,
              new_developers: formatNewDevelopers(newDevelopers)
            }
          },
          farcaster: {
            templateVariables: undefined
          },
          app: {
            templateVariables: undefined
          }
        });
      }
      totalEmailsSent += 1;
    } catch (error) {
      log.error('Error sending points claim email', { error, userId: scout.id });
    }
  }

  return totalEmailsSent;
}
