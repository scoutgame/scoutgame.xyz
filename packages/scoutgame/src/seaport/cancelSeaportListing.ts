import type { OrderComponents } from '@opensea/seaport-js/lib/types';

import { getSeaport } from './seaport';

export async function cancelSeaportListing({ order, sellerWallet }: { order: OrderComponents; sellerWallet: string }) {
  const seaport = await getSeaport();
  const { buildTransaction } = seaport.cancelOrders([order], sellerWallet, 'scoutgame');
  const tx = await buildTransaction();

  return tx;
}
