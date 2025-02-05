import { log } from '@charmverse/core/log';
import { createSablierAirdropCampaign } from '@packages/blockchain/airdrop/createSablierAirdropCampaign';
import { getCurrentSeasonStart, getLastWeek } from '@packages/dates/utils';
import { getTopConnectorOfTheDay } from '@packages/scoutgame/topConnector/getTopConnectors';
import { DateTime } from 'luxon';
import { optimism } from 'viem/chains';

export async function deployTopReferrerRewardsContract() {
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

  try {
    const { hash, contractAddress } = await createSablierAirdropCampaign({
      adminPrivateKey: process.env.SABLIER_OP_AIRDROP_ADMIN_PRIVATE_KEY as `0x${string}`,
      campaignName: `Top Referrer Rewards Season: ${season}, Week: ${week}`,
      chainId: optimism.id,
      tokenAddress: '0x4200000000000000000000000000000000000042',
      tokenDecimals: optimism.nativeCurrency.decimals,
      recipients: topConnectorsAddress.map((address) => ({ address: address as `0x${string}`, amount: 25 }))
    });

    log.info('Top referrer rewards contract deployed', { hash, contractAddress });
  } catch (error) {
    log.error('Error deploying top referrer rewards contract', { error });
  }
}
