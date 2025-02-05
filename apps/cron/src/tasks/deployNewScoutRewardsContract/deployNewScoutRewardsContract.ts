import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { createSablierAirdropCampaign } from '@packages/blockchain/airdrop/createSablierAirdropCampaign';
import { getCurrentSeasonStart, getLastWeek } from '@packages/dates/utils';
import { getRankedNewScoutsForPastWeek } from '@packages/scoutgame/scouts/getNewScouts';
import { optimism } from 'viem/chains';

const newScoutsRewards = [60, 50, 40, 35, 30, 25, 20, 15, 15, 10];

export async function deployNewScoutRewardsContract() {
  try {
    const week = getLastWeek();
    const season = getCurrentSeasonStart(week);
    const newScouts = await getRankedNewScoutsForPastWeek({ week });
    const top10Scouts = newScouts.slice(0, 10);
    const { hash, contractAddress } = await createSablierAirdropCampaign({
      adminPrivateKey: process.env.SABLIER_OP_AIRDROP_ADMIN_PRIVATE_KEY as `0x${string}`,
      campaignName: `New Scout Rewards Season: ${season}, Week: ${week}`,
      chainId: optimism.id,
      recipients: top10Scouts.map((scout, index) => ({
        address: scout.address as `0x${string}`,
        amount: newScoutsRewards[index]
      })),
      tokenAddress: '0x4200000000000000000000000000000000000042',
      tokenDecimals: optimism.nativeCurrency.decimals
    });

    await prisma.partnerReward.createMany({
      data: top10Scouts.map((scout, index) => ({
        amount: newScoutsRewards[index],
        season,
        week,
        userId: scout.id as string,
        contractAddress,
        hash,
        tokenAddress: '0x4200000000000000000000000000000000000042',
        partner: 'optimism:new_scout_rewards',
        chainId: optimism.id,
        txHash: hash
      }))
    });

    log.info('New scout rewards contract deployed', { hash, contractAddress });
  } catch (error) {
    log.error('Error deploying new scout contract', { error });
  }
}
