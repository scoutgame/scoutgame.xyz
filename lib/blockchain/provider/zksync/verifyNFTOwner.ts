import { getPublicClient } from '@root/lib/blockchain/publicClient';
import { lowerCaseEqual } from '@root/lib/utils/strings';
import ERC721_ABI from 'abis/ERC721.json';

import type { SupportedChainId } from './config';

/**
 * @tokenId - An integer representing the ZKSync token id
 */
export async function verifyNFTOwner({
  ownerAddresses,
  tokenId,
  chainId,
  contractAddress
}: {
  contractAddress: string;
  ownerAddresses: string[];
  tokenId: number | string;
  chainId: SupportedChainId;
}): Promise<boolean> {
  const client = getPublicClient(chainId);

  const owner = await client.readContract({
    abi: ERC721_ABI,
    address: contractAddress as `0x${string}`,
    functionName: 'ownerOf',
    args: [BigInt(tokenId || 1).toString()]
  });

  return ownerAddresses.some((a) => lowerCaseEqual(a, owner as string));
}
