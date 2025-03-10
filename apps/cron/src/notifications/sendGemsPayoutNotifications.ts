import { log } from '@charmverse/core/log';
import type { PartnerRewardPayout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentSeasonWeekNumber } from '@packages/dates/utils';
import { sendNotifications } from '@packages/scoutgame/notifications/sendNotifications';
import { getClaimablePoints } from '@packages/scoutgame/points/getClaimablePoints';
import { baseUrl } from '@packages/utils/constants';
import { DateTime } from 'luxon';
import { formatUnits } from 'viem';

const fontFamily = 'Arial, sans-serif';
const fontColor = '#000';
const linkColor = '#3a3a3a';

const partnerRewardsRecord: Record<string, { name: string; partnerLink?: string; icon: string }> = {
  octant_base_contribution: {
    name: 'Octant & Base Contribution',
    partnerLink: 'https://scoutgame.xyz/info/partner-rewards/octant',
    icon: 'https://scoutgame.xyz/images/crypto/usdc.png'
  },
  optimism_new_scout: {
    name: 'Optimism New Scout',
    partnerLink: 'https://scoutgame.xyz/info/partner-rewards/optimism',
    icon: 'https://scoutgame.xyz/images/crypto/op.png'
  },
  optimism_referral_champion: {
    name: 'Optimism Referral Champion',
    partnerLink: 'https://scoutgame.xyz/info/partner-rewards/optimism',
    icon: 'https://scoutgame.xyz/images/crypto/op.png'
  }
};

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
      const partner = partnerRewardsRecord[payout.payoutContract.partner as keyof typeof partnerRewardsRecord];
      html += `<li style="font-family: ${fontFamily}; color: ${fontColor};"><strong>${formatUnits(BigInt(payout.amount), payout.payoutContract.tokenDecimals)}</strong> <img style="width: 16px; height: 16px; vertical-align: -2px;" src="${partner.icon}"/> from ${partner.partnerLink ? `<a style="text-decoration: underline; color: ${linkColor};" href="${partner.partnerLink}">${partner.name}</a>` : partner.name}</li>`;
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
              payoutContract: {
                week
              }
            }
          }
        },
        select: {
          partnerRewardPayouts: {
            where: {
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
      const { points: weeklyClaimablePoints } = await getClaimablePoints({ userId: scout.id, week });
      if (weeklyClaimablePoints) {
        await sendNotifications({
          userId: scout.id,
          email: {
            templateVariables: {
              name: scout.displayName,
              points: weeklyClaimablePoints,
              partner_rewards: formatPartnerRewardPayout(
                'You have also earned these partner rewards this week',
                scout.wallets
              )
            }
          },
          farcaster: {
            templateVariables: {
              points: weeklyClaimablePoints
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
