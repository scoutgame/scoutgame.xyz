import type { OrderComponents } from '@opensea/seaport-js/lib/types';
import type { ethers } from 'ethers';

import { getSeaport } from './seaport';

// Utility function to purchase a seaport listing
export async function purchaseSeaportListing({
  signature,
  orderHash,
  order,
  buyerWallet,
  signer
}: {
  signature: string;
  orderHash: string;
  order: OrderComponents;
  buyerWallet: string;
  signer: ethers.JsonRpcSigner;
}) {
  const seaport = await getSeaport(signer);

  const { executeAllActions } = await seaport.fulfillOrder({
    order: {
      parameters: order,
      signature
    },
    accountAddress: buyerWallet
  });

  const tx = await executeAllActions();

  const receipt = await signer.sendTransaction(tx);

  return receipt;
}
