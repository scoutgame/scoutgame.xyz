import { log } from '@charmverse/core/log';
import type { PartnerRewardPayout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailTemplate } from '@packages/mailer/sendEmailTemplate';
import { getClaimablePoints } from '@packages/scoutgame/points/getClaimablePoints';
import { formatUnits } from 'viem';

const fontFamily = 'Arial, sans-serif';
const fontColor = '#000';

const partnerRewardsRecord: Record<string, { name: string; partnerLink?: string; icon: string; chain: string }> = {
  octant_base_contribution: {
    chain: 'Base',
    name: 'Octant & Base Contribution',
    partnerLink: 'https://scoutgame.xyz/info/partner-rewards/octant',
    icon: 'https://scoutgame.xyz/images/crypto/usdc.png'
  },
  optimism_new_scout: {
    chain: 'Optimism',
    name: 'Optimism New Scout',
    partnerLink: 'https://scoutgame.xyz/info/partner-rewards/optimism',
    icon: 'https://scoutgame.xyz/images/crypto/op.png'
  },
  optimism_referral_champion: {
    chain: 'Optimism',
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
      html += `<li style="font-family: ${fontFamily}; color: ${fontColor};"><strong>${formatUnits(BigInt(payout.amount), payout.payoutContract.tokenDecimals)}</strong> <img style="width: 16px; height: 16px; vertical-align: -2px;" src="${partner.icon}"/> on ${partner.chain} from ${partner.partnerLink ? `<a style="text-decoration: underline; color: ${fontColor};" href="${partner.partnerLink}">${partner.name}</a>` : partner.name}</li>`;
    }
  }
  return `${html}</ul>`;
}

export async function sendGemsPayoutEmails({ week }: { week: string }) {
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

  for (const scout of scouts) {
    try {
      const { points: weeklyClaimablePoints } = await getClaimablePoints({ userId: scout.id, week });
      if (weeklyClaimablePoints) {
        await sendEmailTemplate({
          userId: scout.id,
          senderAddress: `The Scout Game <updates@mail.scoutgame.xyz>`,
          subject: `Claim Your Scout Points ${scout.wallets ? '& Partner Rewards' : ''} This Week! 🎉`,
          templateType: 'weekly_claim',
          templateVariables: {
            name: scout.displayName,
            points: weeklyClaimablePoints,
            partner_rewards: formatPartnerRewardPayout(
              'You have also earned these partner rewards this week',
              scout.wallets
            )
          }
        });
      } else {
        await sendEmailTemplate({
          userId: scout.id,
          senderAddress: `The Scout Game <updates@mail.scoutgame.xyz>`,
          templateType: 'zero_weekly_claim',
          templateVariables: {
            name: scout.displayName,
            partner_rewards: formatPartnerRewardPayout(
              'On the bright side, you have earned these partner rewards this week',
              scout.wallets
            )
          },
          subject: 'No points earned this week? 🤔'
        });
      }
      totalEmailsSent += 1;
    } catch (error) {
      log.error('Error sending points claim email', { error, userId: scout.id });
    }
  }

  return totalEmailsSent;
}
