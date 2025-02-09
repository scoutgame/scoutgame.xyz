import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentSeasonWeekNumber, getLastWeek } from '@packages/dates/utils';
import { getTopConnectorOfTheDay } from '@packages/scoutgame/topConnector/getTopConnectors';
import { DateTime } from 'luxon';
import { parseUnits } from 'viem';
import { optimismSepolia } from 'viem/chains';

import { createSablierAirdropContract } from './createSablierAirdropContract';
import { optimismTokenDecimals, optimismTokenAddress } from './deployNewScoutRewardsContract';

const REFERRAL_CHAMPION_REWARD_AMOUNT = parseUnits('25', optimismTokenDecimals).toString();

export async function deployReferralChampionRewardsContract() {
  const topConnectors: { address: string; date: DateTime }[] = [];
  const week = getLastWeek();
  const season = getCurrentSeasonStart(week);

  for (let day = 1; day <= 7; day++) {
    const date = DateTime.utc().minus({ days: day });
    const topConnector = await getTopConnectorOfTheDay({ date });

    if (topConnector) {
      topConnectors.push({ address: topConnector.address, date });
    }
  }

  if (topConnectors.length === 0) {
    log.info('No top connectors found for the week', {
      week,
      season
    });
    return;
  }

  const { hash, contractAddress, cid, merkleTree } = await createSablierAirdropContract({
    adminPrivateKey: process.env.REFERRAL_CHAMPION_REWARD_ADMIN_PRIVATE_KEY as `0x${string}`,
    campaignName: `Scoutgame Referral Champion S${season}W${getCurrentSeasonWeekNumber(week)} Rewards`,
    chainId: optimismSepolia.id,
    tokenAddress: optimismTokenAddress,
    tokenDecimals: optimismTokenDecimals,
    recipients: topConnectors.map(({ address }) => ({ address: address as `0x${string}`, amount: 25 })),
    nullAddressAmount: 0.001
  });

  log.info('Referral champion rewards contract deployed', {
    hash,
    contractAddress,
    week,
    season
  });

  await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: optimismSepolia.id,
      contractAddress,
      season,
      week,
      ipfsCid: cid,
      merkleTreeJson: merkleTree,
      tokenAddress: optimismTokenAddress,
      tokenDecimals: optimismTokenDecimals,
      tokenSymbol: 'OP',
      partner: 'optimism_referral_champion',
      deployTxHash: hash,
      rewardPayouts: {
        createMany: {
          // Dont rely on merkletree.recipients as it will be normalized
          data: topConnectors.map(({ address, date }) => ({
            amount: REFERRAL_CHAMPION_REWARD_AMOUNT,
            walletAddress: address.toLowerCase(),
            meta: {
              date: date.toJSDate()
            }
          }))
        }
      }
    }
  });

  return {
    hash,
    contractAddress
  };
}
