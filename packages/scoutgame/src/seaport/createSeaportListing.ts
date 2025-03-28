import { ItemType } from '@opensea/seaport-js/lib/constants';
import { isOnchainPlatform } from '@packages/utils/platform';

import { scoutTokenErc20ContractAddress } from '../protocol/constants';

import { getSeaport } from './seaport';

const isOnchain = isOnchainPlatform();

export const nftListingErc20Address = isOnchain
  ? scoutTokenErc20ContractAddress()
  : '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const TREASURY_WALLET = '0xb1b9FFF08F3827875F91ddE929036a65f2A5d27d';

export async function createSeaportListing({
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
          recipient: TREASURY_WALLET
        }
      ]
    },
    sellerWallet
  );

  const order = await executeAllActions();

  return order;
}
