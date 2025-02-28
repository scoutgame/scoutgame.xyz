import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getCurrentWeek } from '@packages/dates/utils';
import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerReward/getBuilderEventsForPartnerReward';
import { getReferralsToReward } from '@packages/scoutgame/quests/getReferralsToReward';
import { getNewScoutRewards } from '@packages/scoutgame/scouts/getNewScoutRewards';
import { formatUnits, parseUnits, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { sendDiscordAlert } from '../../utils/sendDiscordAlert';

// Partner configuration
const PARTNERS = [
  {
    id: 'optimism_referral_champion',
    privateKeyEnvVar: 'REFERRAL_CHAMPION_REWARD_ADMIN_PRIVATE_KEY'
  },
  {
    id: 'optimism_new_scout',
    privateKeyEnvVar: 'NEW_SCOUT_REWARD_ADMIN_PRIVATE_KEY'
  },
  {
    id: 'octant_base_contribution',
    privateKeyEnvVar: 'OCTANT_BASE_CONTRIBUTION_REWARD_ADMIN_PRIVATE_KEY'
  }
];

export async function alertLowAirdropWalletBalance() {
  log.info('Starting alertLowAirdropWalletBalance task');

  const currentWeek = getCurrentWeek();

  for (const partner of PARTNERS) {
    try {
      log.info(`Checking wallet balance for partner: ${partner.id}`);

      // Get the private key from environment variables
      const privateKey = process.env[partner.privateKeyEnvVar];

      if (!privateKey) {
        log.warn(
          `Missing private key for partner: ${partner.id}. Environment variable ${partner.privateKeyEnvVar} not set.`
        );
        continue;
      }

      // Generate wallet address from private key
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      const walletAddress = account.address;

      // Get the partner's token information
      const partnerData = await prisma.partnerRewardPayoutContract.findFirst({
        where: {
          partner: partner.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          tokenAddress: true,
          chainId: true,
          tokenSymbol: true,
          tokenDecimals: true
        }
      });

      if (!partnerData || !partnerData.tokenAddress) {
        log.warn(`Missing token information for partner: ${partner.id}`);
        continue;
      }

      // Calculate the upcoming payout amount for this week
      const upcomingPayout = await calculateUpcomingPayout({
        partner: partner.id,
        week: currentWeek,
        tokenDecimals: partnerData.tokenDecimals
      });

      if (upcomingPayout === BigInt(0)) {
        log.info(`No upcoming payout for partner: ${partner.id}`);
        continue;
      }

      // Check the wallet balance
      const walletBalance = await getWalletTokenBalance({
        walletAddress,
        tokenAddress: partnerData.tokenAddress,
        chainId: partnerData.chainId
      });

      // Format amounts for logging and alerts
      const formattedBalance = formatUnits(walletBalance, partnerData.tokenDecimals);
      const formattedPayout = formatUnits(upcomingPayout, partnerData.tokenDecimals);

      log.info(
        `Partner: ${partner.id}, Wallet: ${walletAddress}, Balance: ${formattedBalance} ${partnerData.tokenSymbol}, Upcoming Payout: ${formattedPayout} ${partnerData.tokenSymbol}`
      );

      // Check if balance is too low
      if (walletBalance < upcomingPayout) {
        const shortfall = formatUnits(upcomingPayout - walletBalance, partnerData.tokenDecimals);

        log.warn(
          `Low wallet balance for partner: ${partner.id}. Balance: ${formattedBalance} ${partnerData.tokenSymbol}, Needed: ${formattedPayout} ${partnerData.tokenSymbol}`
        );

        // Send Discord alert
        await sendDiscordAlert({
          content: `<@&1027309276454207519>: Airdrop wallet needs more funds`,
          title: '🚨 Low Airdrop Wallet Balance Alert',
          description: `Partner **${partner.id}** has insufficient funds for the upcoming airdrop.`,
          fields: [
            { name: 'Wallet', value: walletAddress },
            { name: 'Current Balance', value: `${formattedBalance} ${partnerData.tokenSymbol}` },
            { name: 'Required for Airdrop', value: `${formattedPayout} ${partnerData.tokenSymbol}` },
            { name: 'Shortfall', value: `${shortfall} ${partnerData.tokenSymbol}` },
            { name: 'Week', value: currentWeek }
          ],
          color: 0xff0000 // Red color for alert
        });
      } else {
        log.info(`Wallet balance is sufficient for partner: ${partner.id}`);
      }
    } catch (error) {
      log.error(`Error checking wallet balance for partner: ${partner.id}`, { error });
    }
  }

  log.info('Completed alertLowAirdropWalletBalance task');
}

async function getWalletTokenBalance({
  walletAddress,
  tokenAddress,
  chainId
}: {
  walletAddress: string;
  tokenAddress: string;
  chainId: number;
}): Promise<bigint> {
  try {
    const publicClient = getPublicClient(chainId);

    const balance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }]
        }
      ],
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`]
    });

    return balance as bigint;
  } catch (error) {
    log.error('Error fetching wallet token balance:', { error });
    return BigInt(0);
  }
}

async function calculateUpcomingPayout({
  partner,
  week,
  tokenDecimals
}: {
  partner: string;
  week: string;
  tokenDecimals: number;
}): Promise<bigint> {
  try {
    const toWei = (v: number) => {
      return parseUnits(v.toString(), tokenDecimals);
    };

    if (partner === 'optimism_referral_champion') {
      const referrals = await getReferralsToReward({ week });
      return referrals.reduce((sum, referral) => sum + toWei(referral.opAmount), BigInt(0));
    } else if (partner === 'optimism_new_scout') {
      const scouts = await getNewScoutRewards({ week });
      return scouts.reduce((sum, scout) => sum + toWei(scout.opAmount), BigInt(0));
    } else if (partner === 'octant_base_contribution') {
      const builderEvents = await getBuilderEventsForPartnerRewards({ week, bonusPartner: 'octant' });
      const uniqueWallets = new Set(builderEvents.map((event) => event.githubUser.builder!.wallets[0]?.address));
      return toWei(75) * BigInt(uniqueWallets.size);
    }

    return BigInt(0);
  } catch (error) {
    log.error(`Error calculating upcoming payout for partner: ${partner}`, { error });
    return BigInt(0);
  }
}
