import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getLastWeek } from '@packages/dates/utils';
import { getTopConnectorOfTheDay } from '@packages/scoutgame/topConnector/getTopConnectors';
import { DateTime } from 'luxon';
import { parseUnits } from 'viem';
import { optimism } from 'viem/chains';

import { createSablierAirdropContract } from '../../airdrop/createSablierAirdropContract';

import { optimismTokenDecimals, optimismTokenAddress } from './createNewScoutRewardsContract';

const TOP_REFERRER_REWARDS_AMOUNT = parseUnits('25', optimismTokenDecimals);

export async function createTopReferrerRewardsContract() {
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

  const { hash, contractAddress } = await createSablierAirdropContract({
    adminPrivateKey: process.env.OP_AIRDROP_ADMIN_PRIVATE_KEY as `0x${string}`,
    campaignName: `Top Referrer Rewards Season: ${season}, Week: ${week}`,
    chainId: optimism.id,
    tokenAddress: optimismTokenAddress,
    tokenDecimals: optimismTokenDecimals,
    recipients: topConnectors.map(({ address }) => ({ address: address as `0x${string}`, amount: 25 }))
  });

  await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: optimism.id,
      contractAddress,
      season,
      week,
      tokenAddress: optimismTokenAddress,
      tokenDecimals: optimismTokenDecimals,
      partner: 'optimism_top_referrer',
      deployTxHash: hash,
      rewardPayouts: {
        createMany: {
          data: topConnectors.map(({ address, date }) => ({
            amount: TOP_REFERRER_REWARDS_AMOUNT,
            userId: address,
            meta: {
              date: date.toJSDate()
            }
          }))
        }
      }
    }
  });

  return { hash, contractAddress };
}
