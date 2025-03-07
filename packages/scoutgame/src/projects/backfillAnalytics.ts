import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { recordContractAnalytics } from '@packages/blockchain/analytics/recordContractAnalytics';
import { recordWalletAnalytics } from '@packages/blockchain/analytics/recordWalletAnalytics';
import { DateTime } from 'luxon';
import { taiko, taikoTestnetSepolia } from 'viem/chains';

type BackfillInput = {
  contracts?: { address: string; chainId: number }[];
  wallets?: { address: string; chainId: number }[];
  userId?: string;
};

// Backfill contract and wallet analytics for the past 30 days
export async function backfillAnalytics({ contracts = [], userId, wallets = [] }: BackfillInput) {
  const endDate = new Date();
  const startDate = DateTime.fromJSDate(endDate).minus({ days: 30 }).toJSDate();

  for (const { address, chainId } of contracts) {
    // taiko is a separate, very slow process, so skip for now
    if (chainId === taiko.id || chainId === taikoTestnetSepolia.id) {
      log.debug('Skipping taiko wallet');
      return;
    }
    const contract = await prisma.scoutProjectContract.findUniqueOrThrow({
      where: {
        address_chainId: {
          address,
          chainId
        }
      }
    });
    const pollStart = new Date().getTime();
    try {
      const result = await recordContractAnalytics(contract, startDate, endDate);
      if (result) {
        log.info(`Backfilled analytics for contract ${address}`, {
          endDate: result.endDate,
          startDate: result.startDate,
          processTime: Date.now() - pollStart,
          userId,
          contractId: contract.id
        });
      }
    } catch (error) {
      log.error(`Error backfilling analytics for contract ${contract.address}`, {
        contractId: contract.id,
        userId,
        error
      });
    }
  }

  // backfill analytics for wallets
  for (const { address, chainId } of wallets) {
    // taiko is a separate, very slow process, so skip for now
    if (chainId === taiko.id || chainId === taikoTestnetSepolia.id) {
      log.debug('Skipping taiko wallet');
      return;
    }
    const wallet = await prisma.scoutProjectWallet.findUniqueOrThrow({
      where: {
        address_chainId: {
          address,
          chainId
        }
      }
    });
    const pollStart = new Date().getTime();
    try {
      const result = await recordWalletAnalytics(wallet, startDate, endDate);
      if (result) {
        log.info(`Backfilled analytics for wallet ${wallet.address}`, {
          endDate: result.endDate,
          startDate: result.startDate,
          processTime: Date.now() - pollStart,
          userId,
          walletId: wallet.id
        });
      }
    } catch (error) {
      log.error(`Error backfilling analytics for wallet ${wallet.address}`, {
        walletId: wallet.id,
        userId,
        error
      });
    }
  }
}
