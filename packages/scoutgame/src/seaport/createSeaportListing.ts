import { isOnchainPlatform } from '@packages/utils/platform';

import { scoutTokenErc20ContractAddress } from '../protocol/constants';

import { getSeaport } from './seaport';

const isOnchain = isOnchainPlatform();

export const nftListingErc20Address = isOnchain
  ? scoutTokenErc20ContractAddress()
  : '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

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
          token: contractAddress,
          identifier: tokenId,
          amount: amount.toString()
        }
      ],
      consideration: [
        {
          // If onchain, use the scout token, otherwise use USDC on base
          token: nftListingErc20Address,
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
