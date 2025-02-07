import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentSeasonWeekNumber, getLastWeek } from '@packages/dates/utils';
import { getTopConnectorOfTheDay } from '@packages/scoutgame/topConnector/getTopConnectors';
import { DateTime } from 'luxon';
import { parseUnits } from 'viem';
import { optimismSepolia } from 'viem/chains';

import { createSablierAirdropContract } from './createSablierAirdropContract';
import { optimismTokenDecimals, optimismTokenAddress } from './deployNewScoutRewardsContract';

const TOP_REFERRER_REWARDS_AMOUNT = parseUnits('25', optimismTokenDecimals).toString();

export async function deployTopReferrerRewardsContract() {
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

  if (topConnectors.length === 1) {
    log.info('Only one top connector found for the week.', {
      week,
      season
    });
    return;
  }

  const { hash, contractAddress, cid, root } = await createSablierAirdropContract({
    adminPrivateKey: process.env.OP_AIRDROP_ADMIN_PRIVATE_KEY as `0x${string}`,
    campaignName: `Scoutgame Top Referrer S${season}W${getCurrentSeasonWeekNumber(week)} Rewards`,
    chainId: optimismSepolia.id,
    tokenAddress: optimismTokenAddress,
    tokenDecimals: optimismTokenDecimals,
    recipients: topConnectors.map(({ address }) => ({ address: address as `0x${string}`, amount: 25 }))
  });

  await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: optimismSepolia.id,
      contractAddress,
      season,
      week,
      ipfsCid: cid,
      merkleTreeJson: {
        root,
        recipients: topConnectors.map(({ address }) => ({
          address: address as `0x${string}`,
          amount: TOP_REFERRER_REWARDS_AMOUNT
        }))
      },
      tokenAddress: optimismTokenAddress,
      tokenDecimals: optimismTokenDecimals,
      tokenSymbol: 'OP',
      partner: 'optimism_top_referrer',
      deployTxHash: hash,
      rewardPayouts: {
        createMany: {
          data: topConnectors.map(({ address, date }) => ({
            amount: TOP_REFERRER_REWARDS_AMOUNT,
            walletAddress: address.toLowerCase(),
            meta: {
              date: date.toJSDate()
            }
          }))
        }
      }
    }
  });

  log.info('Top referrer rewards contract deployed', {
    hash,
    contractAddress,
    week,
    season
  });

  return {
    hash,
    contractAddress
  };
}
