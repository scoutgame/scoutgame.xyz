import { ItemType } from '@opensea/seaport-js/lib/constants';

import { getSeaport } from './seaport';

export async function createSeaportListing({
  sellerWallet,
  price,
  amount,
  contractAddress,
  tokenId
}: {
  sellerWallet: string;
  price: bigint;
  amount: number;
  contractAddress: string;
  tokenId: string;
}) {
  if (!contractAddress || !tokenId || !price || !amount || !sellerWallet) {
    throw new Error('Missing required parameters');
  }

  const seaport = await getSeaport();

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

  return order;
}
