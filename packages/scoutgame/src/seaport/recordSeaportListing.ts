import { ItemType } from '@opensea/seaport-js/lib/constants';
import { scoutTokenContractAddress } from '@packages/scoutgame/protocol/constants';

import { treasuryAddress } from '../builderNfts/constants';

import { getSeaport } from './seaport';

export const nftListingErc20Address = scoutTokenContractAddress;

export async function recordSeaportListing({
  sellerWallet,
  price,
  amount,
  contractAddress,
  tokenId,
  developerWallet
}: {
  sellerWallet: string;
  price: bigint;
  amount: number;
  contractAddress: string;
  tokenId: string;
  developerWallet: string;
}) {
  if (!contractAddress || !tokenId || !price || !amount || !sellerWallet || !developerWallet) {
    throw new Error('Missing required parameters');
  }

  const seaport = await getSeaport();

  // Calculate fee amounts
  const developerFee = (price * BigInt(1)) / BigInt(100); // 1%
  const treasuryFee = (price * BigInt(4)) / BigInt(100); // 4%
  const sellerAmount = price - developerFee - treasuryFee; // 95%

  const { executeAllActions } = await seaport.createOrder(
    {
      domain: 'scoutgame.xyz',
      // 1 year in unix timestamp
      endTime: Math.floor(Date.now() / 1000) + 1000 * 60 * 60 * 24 * 365,
      allowPartialFills: false,
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
          // 95% to seller
          token: nftListingErc20Address,
          amount: sellerAmount.toString(),
          recipient: sellerWallet
        },
        {
          // 1% to developer wallet
          token: nftListingErc20Address,
          amount: developerFee.toString(),
          recipient: developerWallet
        },
        {
          // 4% to treasury
          token: nftListingErc20Address,
          amount: treasuryFee.toString(),
          recipient: treasuryAddress
        }
      ]
    },
    sellerWallet
  );

  const order = await executeAllActions();

  return order;
}
