import type { OrderComponents } from '@opensea/seaport-js/lib/types';
import type { ethers } from 'ethers';

import { getSeaport } from './seaport';

export async function cancelSeaportListing({
  order,
  signer,
  sellerWallet
}: {
  order: OrderComponents;
  signer: ethers.JsonRpcSigner;
  sellerWallet: string;
}) {
  const seaport = await getSeaport(signer);

  const { buildTransaction } = seaport.cancelOrders([order], sellerWallet, 'scoutgame');
  const tx = await buildTransaction();
  const receipt = await signer.sendTransaction(tx);

  return receipt;
}
