import { log } from '@charmverse/core/log';
import { createSablierAirdropCampaign } from '@packages/blockchain/airdrop/createSablierAirdropCampaign';
import { getLastWeek } from '@packages/dates/utils';
import { getRankedNewScoutsForPastWeek } from '@packages/scoutgame/scouts/getNewScouts';
import { optimism } from 'viem/chains';

const newScoutsRewards = [60, 50, 40, 35, 30, 25, 20, 15, 15, 10];

export async function deployNewScoutContract() {
  const week = getLastWeek();
  const newScouts = await getRankedNewScoutsForPastWeek({ week });

  const top10Scouts = newScouts.slice(0, 10);

  try {
    const { hash, contractAddress } = await createSablierAirdropCampaign({
      adminPrivateKey: process.env.SABLIER_OP_AIRDROP_ADMIN_PRIVATE_KEY as `0x${string}`,
      campaignName: `New Scout Rewards ${week}`,
      chainId: optimism.id,
      recipients: top10Scouts.map((scout, index) => ({
        address: scout.address as `0x${string}`,
        amount: newScoutsRewards[index]
      })),
      tokenAddress: '0x4200000000000000000000000000000000000042',
      tokenDecimals: 18
    });
    log.info('New scout rewards contract deployed', { hash, contractAddress });
  } catch (error) {
    log.error('Error deploying new scout contract', { error });
  }
}
