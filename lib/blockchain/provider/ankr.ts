import type { Nft } from '@ankr.com/ankr.js';
import { AnkrProvider } from '@ankr.com/ankr.js';
import { RateLimit } from 'async-sema';

import { getNFTUrl } from 'components/common/CharmEditor/components/nft/utils';
import { paginatedCall } from 'lib/utilities/async';
import { typedKeys } from 'lib/utilities/objects';

import type { NFTData } from '../getNFTs';

// 50 requests/minute for Public tier - https://www.ankr.com/docs/rpc-service/service-plans/#rate-limits
const rateLimiter = RateLimit(0.8);

// Find supported chains:  https://www.npmjs.com/package/@ankr.com/ankr.js
// Note: we commented out chains already supported by alchemy
const ankrAdvancedApis = {
  // 1: 'eth',
  // 5: 'eth_goerli',
  // 10: 'optimism',
  56: 'bsc',
  // 137: 'polygon',
  250: 'fantom',
  // 42161: 'arbitrum',
  43114: 'avalanche'
} as const;

// We can still support chains that dont have an advanced api
const rpcApis = [5000] as const;

// https://docs.alchemy.com/docs/why-use-alchemy#-blockchains-supported
export const supportedChainIds = [...typedKeys(ankrAdvancedApis), ...rpcApis];
export type SupportedChainId = (typeof supportedChainIds)[number];

export const supportedMainnets: SupportedChainId[] = [56, 250, 43114];

const advancedAPIEndpoint = `https://rpc.ankr.com/multichain/${process.env.ANKR_API_ID}`;
const mantleRPCEndpoint = `https://rpc.ankr.com/mantle/${process.env.ANKR_API_ID}`;

// Docs: https://api-docs.ankr.com/reference/post_ankr-getnftholders
export async function getNFTs({
  chainId,
  address,
  walletId
}: {
  chainId: SupportedChainId;
  address: string;
  walletId: string;
}): Promise<NFTData[]> {
  const provider = new AnkrProvider(advancedAPIEndpoint);
  if (chainId === 5000) {
    // TODO: find a provider that indexes the Mantle blockchain for NFTs
    return [];
  }
  const blockchain = ankrAdvancedApis[chainId];
  if (!blockchain) throw new Error(`Chain id "${chainId}" not supported by Ankr`);
  const results = await paginatedCall(
    async (params) => {
      await rateLimiter();
      return provider.getNFTsByOwner({
        ...params,
        blockchain,
        walletAddress: address
      });
    },
    (response) => (response.nextPageToken ? { pageToken: response.nextPageToken } : null)
  );
  const nfts = results
    .map((result) => result.assets)
    .flat()
    .map((nft) => mapNFTData(nft, walletId, chainId));
  return nfts;
}

type GetNFTInput = {
  address: string;
  tokenId: string;
  chainId: SupportedChainId;
};

export async function getNFT({ address, tokenId, chainId }: GetNFTInput): Promise<NFTData | null> {
  // TODO: handle Mantle: https://ethereum.stackexchange.com/questions/144319/how-to-get-all-the-owners-from-an-nft-collection
  if (chainId === 5000) {
    const provider = new AnkrProvider(mantleRPCEndpoint);
    return null;
  }
  const provider = new AnkrProvider(advancedAPIEndpoint);
  const blockchain = ankrAdvancedApis[chainId];
  if (!blockchain) throw new Error(`Chain id "${chainId}" not supported by Ankr`);
  await rateLimiter();
  const nft = await provider.getNFTMetadata({
    blockchain,
    tokenId,
    contractAddress: address,
    forceFetch: false
  });
  if (!nft.attributes || !nft.metadata) {
    return null;
  }
  return mapNFTData({ ...nft.attributes, ...nft.metadata }, null, chainId);
}

type GetNFTOwnerInput = {
  address: string;
  chainId: SupportedChainId;
};

// https://github.com/charmverse/api.charmverse.io/blob/main/lib/blockchain/index.ts

export async function getNFTOwners({ address, chainId }: GetNFTOwnerInput): Promise<string[]> {
  // TODO: handle Mantle: https://ethereum.stackexchange.com/questions/144319/how-to-get-all-the-owners-from-an-nft-collection
  if (chainId === 5000) {
    const provider = new AnkrProvider(mantleRPCEndpoint);
    return [];
  }
  const provider = new AnkrProvider(advancedAPIEndpoint);
  const blockchain = ankrAdvancedApis[chainId];
  if (!blockchain) throw new Error(`Chain id "${chainId}" not supported by Ankr`);
  const results = await paginatedCall(
    async (params) => {
      await rateLimiter();
      return provider.getNFTHolders({
        ...params,
        contractAddress: address,
        blockchain
      });
    },
    (response) => (response.nextPageToken ? { pageToken: response.nextPageToken } : null)
  );
  return results.map((res) => res.holders).flat();
}

type NFTFields = Pick<Nft, 'contractAddress' | 'tokenId' | 'imageUrl' | 'name'>;

function mapNFTData(nft: NFTFields, walletId: string | null, chainId: SupportedChainId): NFTData {
  const tokenIdInt = parseInt(nft.tokenId, 16);
  const link = getNFTUrl({ chain: chainId, contract: nft.contractAddress, token: tokenIdInt }) ?? '';
  return {
    id: `${nft.contractAddress}:${nft.tokenId}`,
    tokenId: nft.tokenId,
    tokenIdInt,
    contract: nft.contractAddress,
    imageRaw: nft.imageUrl,
    image: nft.imageUrl,
    imageThumb: nft.imageUrl,
    title: nft.name,
    description: '',
    chainId,
    timeLastUpdated: new Date(1970).toISOString(),
    isHidden: false,
    isPinned: false,
    link,
    walletId
  };
}
