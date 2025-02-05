import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getLastWeek } from '@packages/dates/utils';
import { getTopConnectorOfTheDay } from '@packages/scoutgame/topConnector/getTopConnectors';
import { DateTime } from 'luxon';
import { optimism } from 'viem/chains';

import { createSablierAirdropContract } from '../../airdrop/createSablierAirdropContract';

const TOP_REFERRER_REWARDS_AMOUNT = 25;

export async function createTopReferrerRewardsContract() {
  const topConnectorsAddress: string[] = [];
  const week = getLastWeek();
  const season = getCurrentSeasonStart(week);

  for (let day = 1; day <= 7; day++) {
    const date = DateTime.utc().minus({ days: day });
    const topConnector = await getTopConnectorOfTheDay({ date });

    if (topConnector) {
      topConnectorsAddress.push(topConnector.address);
    }
  }

  const { hash, contractAddress } = await createSablierAirdropContract({
    adminPrivateKey: process.env.SABLIER_OP_AIRDROP_ADMIN_PRIVATE_KEY as `0x${string}`,
    campaignName: `Top Referrer Rewards Season: ${season}, Week: ${week}`,
    chainId: optimism.id,
    tokenAddress: '0x4200000000000000000000000000000000000042',
    tokenDecimals: optimism.nativeCurrency.decimals,
    recipients: topConnectorsAddress.map((address) => ({ address: address as `0x${string}`, amount: 25 }))
  });

  await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: optimism.id,
      contractAddress,
      season,
      week,
      tokenAddress: '0x4200000000000000000000000000000000000042',
      partner: 'optimism:top_referrer_rewards',
      deployTxHash: hash,
      rewardPayouts: {
        createMany: {
          data: topConnectorsAddress.map((address) => ({
            amount: TOP_REFERRER_REWARDS_AMOUNT,
            userId: address
          }))
        }
      }
    }
  });

  return { hash, contractAddress };
}
