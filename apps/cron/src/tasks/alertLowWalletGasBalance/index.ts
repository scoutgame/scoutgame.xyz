import { getLogger } from '@charmverse/core/log';
import { minterPrivateKey } from '@packages/scoutgame/protocol/constants';
import { POST } from '@packages/utils/http';
import type Koa from 'koa';
import type { Address } from 'viem/accounts';
import { privateKeyToAccount } from 'viem/accounts';

import { alertLowAirdropWalletBalance } from './alertLowAirdropWalletBalance';
import { getWalletGasBalanceInUSD } from './getWalletGasBalanceInUSD';

const thresholdUSD = 15;

const log = getLogger('cron-alert-low-wallet-gas-balance');

export async function alertLowWalletGasBalance(
  ctx: Koa.Context,
  discordWebhook: string | undefined = process.env.DISCORD_ALERTS_WEBHOOK
) {
  if (!discordWebhook) {
    throw new Error('No Discord webhook found');
  }

  const builderCreatorAddress = privateKeyToAccount(
    minterPrivateKey.startsWith('0x') ? (minterPrivateKey as Address) : `0x${minterPrivateKey}`
  ).address;

  const balanceInUSD = await getWalletGasBalanceInUSD(builderCreatorAddress);
  log.info(`Admin wallet has a balance of ${balanceInUSD} USD`);
  if (balanceInUSD <= thresholdUSD) {
    await POST(discordWebhook, {
      content: `<@&1027309276454207519>: Admin wallet has a low balance: ${balanceInUSD} USD. (Threshold is ${thresholdUSD} USD)`,
      embeds: [
        {
          title: `View wallet: ${builderCreatorAddress}`,
          url: 'https://optimism.blockscout.com/address/0x518AF6fA5eEC4140e4283f7BDDaB004D45177946'
        }
      ]
    });
  }
  await alertLowAirdropWalletBalance();
}
