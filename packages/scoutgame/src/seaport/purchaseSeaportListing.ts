import type { OrderWithCounter } from '@opensea/seaport-js/lib/types';
import type { ethers } from 'ethers';

import { getSeaport } from './seaport';

// Utility function to purchase a seaport listing
export async function purchaseSeaportListing({ order, buyerWallet }: { order: OrderWithCounter; buyerWallet: string }) {
  const seaport = await getSeaport();

  const { executeAllActions } = await seaport.fulfillOrder({
    order,
    accountAddress: buyerWallet
  });

  const tx = await executeAllActions();

  return tx as ethers.TransactionResponse;
}
