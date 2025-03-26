import { ItemType } from '@opensea/seaport-js/lib/constants';
import type { ethers } from 'ethers';

import { getSeaport } from './seaport';

// Utility function to create a seaport listing
export async function createSeaportListing({
  sellerWallet,
  price,
  amount,
  contractAddress,
  tokenId,
  signer
}: {
  sellerWallet: string;
  price: string | number | bigint;
  amount: number;
  contractAddress: string;
  tokenId: string;
  signer: ethers.JsonRpcSigner;
}) {
  const seaport = await getSeaport(signer);

  const { executeAllActions } = await seaport.createOrder(
    {
      offer: [
        {
          itemType: ItemType.ERC1155,
          token: contractAddress,
          identifier: tokenId,
          amount: amount.toString()
        }
      ],
      consideration: [
        {
          amount: price.toString(),
          recipient: sellerWallet
        }
      ]
    },
    sellerWallet
  );

  const order = await executeAllActions();

  return {
    order,
    orderHash: seaport.getOrderHash(order.parameters)
  };
}
