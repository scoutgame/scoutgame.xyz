import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import type { BuilderNftType, Prisma } from '@charmverse/core/prisma';
import type { ISOWeek } from '@packages/dates/config';
import type { Address } from 'viem';
import type { Chain } from 'viem/chains';
import { base } from 'viem/chains';

export const decentApiKey = env('DECENT_API_KEY') || (process.env.REACT_APP_DECENT_API_KEY as string);

export const useTestnets = false;

/**
 * Currently priced in USDC
 */
export const builderTokenDecimals = 6;

export const nftChain: Chain = base; // useTestnets ? optimismSepolia : optimism;

export function getBuilderNftContractAddress(season: ISOWeek): Address {
  // Convert from ISOWeek "-" to "_" which is used in the env variables
  const seasonName = season.replace('-', '_');

  const envVarName = `BUILDER_NFT_CONTRACT_ADDRESS_${seasonName}`;

  const address = env(envVarName) || process.env[`REACT_APP_${envVarName}`];
  if (!address) {
    log.warn(`Builder NFT contract address for ${season} not found`);
  }
  return address?.toLowerCase() as Address;
}

export function getBuilderNftStarterPackContractAddress(season: ISOWeek): Address {
  // Convert from ISOWeek "-" to "_" which is used in the env variables
  const seasonName = season.replace('-', '_');

  const envVarName = `BUILDER_NFT_STARTER_PACK_CONTRACT_ADDRESS_${seasonName}`;

  return (env(envVarName) || process.env[`REACT_APP_${envVarName}`])?.toLowerCase() as Address;
}

export function getBuilderNftContractAddressForNftType({
  nftType,
  season
}: {
  nftType: BuilderNftType;
  season: ISOWeek;
}): Address {
  return nftType === 'starter_pack'
    ? getBuilderNftStarterPackContractAddress(season)
    : getBuilderNftContractAddress(season);
}

// USDC Contract we use for payments
export const usdcOptimismSepoliaContractAddress = '0x5fd84259d66Cd46123540766Be93DFE6D43130D7';
export const usdcOptimismMainnetContractAddress = '0x0b2c639c533813f4aa9d7837caf62653d097ff85';

export const optimismUsdcContractAddress = useTestnets
  ? usdcOptimismSepoliaContractAddress
  : usdcOptimismMainnetContractAddress;

export const builderSmartContractMinterKey = process.env.BUILDER_SMART_CONTRACT_MINTER_PRIVKEY as string;

// Actual target wallet - Scoutgame.eth
export const scoutgameEthAddress = '0x93326D53d1E8EBf0af1Ff1B233c46C67c96e4d8D';
export const treasuryAddress = '0x4a01d4c6821ba65B36420735E2397B40Ce64EB2F';

export function getDecentApiKey() {
  const apiKey = env('DECENT_API_KEY') || process.env.REACT_APP_DECENT_API_KEY;
  return apiKey;
}

// Selecting the top 100 builders
export const weeklyRewardableBuilders = 100;

export function isPreseason01Contract(contractAddress: string): boolean {
  const preseason01 = '2024-W41';

  const preseason01Addresses = [
    getBuilderNftContractAddress(preseason01),
    getBuilderNftStarterPackContractAddress(preseason01)
  ];

  if (preseason01Addresses.includes(contractAddress.toLowerCase() as Address)) {
    return true;
  }

  return false;
}

export function isStarterNftContract(contractAddress: string): boolean {
  const starterPackAddresses = [
    getBuilderNftStarterPackContractAddress('2024-W41'),
    getBuilderNftStarterPackContractAddress('2025-W02'),
    getBuilderNftStarterPackContractAddress('2025-W18')
  ];

  if (starterPackAddresses.includes(contractAddress.toLowerCase() as Address)) {
    return true;
  }

  return false;
}

/**
 * Sunday night on January 6th 2025
 * https://optimism.blockscout.com/block/0x89dc6ef947a3ae010ac3605e47b37826291b90781cadd294c04281a3032f6896
 */
export const lastBlockOfPreSeason01 = 130_261_411;

// const serverClient = getWalletClient({ chainId: nftChain.id, privateKey: builderSmartContractMinterKey });

// const apiClient = new BuilderNFTSeasonOneClient({
//   chain: nftChain,
//   contractAddress: getBuilderNftContractAddress(),
//   walletClient: serverClient
// });

// apiClient
//   .mint({
//     args: {
//       account: '0x4A29c8fF7D6669618580A68dc691565B07b19e25',
//       tokenId: BigInt(1),
//       amount: BigInt(1)
//     }
//   })
//   .then(console.log);

/**
 * We store the 0x000...0000 address as a null in our database
 *
 * A mint transaction comes from sender wallet and has a linked wallet address
 */
export const validMintNftPurchaseEvent = {
  senderWalletAddress: null,
  walletAddress: {
    not: null
  }
} as const satisfies Prisma.NFTPurchaseEventWhereInput;
