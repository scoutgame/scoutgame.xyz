import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import type { BuilderNftType } from '@charmverse/core/prisma';
import type { Address } from 'viem';
import type { Chain } from 'viem/chains';
import { optimism, optimismSepolia } from 'viem/chains';

import type { ISOWeek } from '../dates/config';
import { getCurrentSeasonStart } from '../dates/utils';

export const decentApiKey = env('DECENT_API_KEY') || (process.env.REACT_APP_DECENT_API_KEY as string);

export const useTestnets = false;

/**
 * Currently priced in USDC
 */
export const builderTokenDecimals = 6;

export const builderNftChain: Chain = useTestnets ? optimismSepolia : optimism;
export const builderCreatorAddress = '0x854AFEBD6A5ed967A2D959eFE23d79336B3a4310';

if (builderNftChain.id !== optimism.id) {
  log.warn(`Builder NFT chain is using "${builderNftChain.name}" not Optimism`);
}

// Dev contracts we also deployed for easier use
const devOptimismSepoliaBuildersContract = '0x2f6093b70562729952bf379633dee3e89922d717';
const devOptimismMainnetBuildersContract = '0x1d305a06cb9dbdc32e08c3d230889acb9fe8a4dd';

const realOptimismSepoliaBuildersContract = '0x0b7342761a10e1b14df427681b967e67f5e6cef9';
export const realOptimismMainnetBuildersContract = '0x743ec903fe6d05e73b19a6db807271bb66100e83';

export function getBuilderNftContractAddress(season: ISOWeek = getCurrentSeasonStart()): Address {
  // Convert from ISOWeek "-" to "_" which is used in the env variables
  const seasonName = season.replace('-', '_');

  const envVarName = `BUILDER_NFT_CONTRACT_ADDRESS_${seasonName}`;

  const address = env(envVarName) || process.env[`REACT_APP_${envVarName}`];
  if (!address) {
    log.warn(`Builder NFT contract address for ${season} not found`);
  }
  return address?.toLowerCase() as Address;
}

export function getBuilderNftStarterPackContractAddress(season: ISOWeek = getCurrentSeasonStart()): Address {
  // Convert from ISOWeek "-" to "_" which is used in the env variables
  const seasonName = season.replace('-', '_');

  const envVarName = `BUILDER_NFT_STARTER_PACK_CONTRACT_ADDRESS_${seasonName}`;

  return (env(envVarName) || process.env[`REACT_APP_${envVarName}`])?.toLowerCase() as Address;
}

/**
 * Max amount of starter pack NFTs a user can mint
 */
export const MAX_STARTER_PACK_PURCHASES = 3;

export function getBuilderNftContractAddressForNftType(nftType: BuilderNftType): Address {
  return nftType === 'starter_pack' ? getBuilderNftStarterPackContractAddress() : getBuilderNftContractAddress();
}

// USDC Contract we use for payments
export const usdcOptimismSepoliaContractAddress = '0x5fd84259d66Cd46123540766Be93DFE6D43130D7';
export const usdcOptimismMainnetContractAddress = '0x0b2c639c533813f4aa9d7837caf62653d097ff85';

export const optimismUsdcContractAddress = useTestnets
  ? usdcOptimismSepoliaContractAddress
  : usdcOptimismMainnetContractAddress;

export const builderSmartContractMinterKey = process.env.BUILDER_SMART_CONTRACT_MINTER_PRIVKEY as string;

// Actual target wallet - Scoutgame.eth
export const treasuryAddress = '0x93326D53d1E8EBf0af1Ff1B233c46C67c96e4d8D';

export function getDecentApiKey() {
  const apiKey = env('DECENT_API_KEY') || process.env.REACT_APP_DECENT_API_KEY;
  return apiKey;
}

export const scoutPointsShare = 0.8;
export const builderPointsShare = 0.2;

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

export function isStarterPackContract(contractAddress: string): boolean {
  const starterPackAddresses = [
    getBuilderNftStarterPackContractAddress('2024-W41') || getBuilderNftStarterPackContractAddress('2025-W02')
  ];

  if (starterPackAddresses.includes(contractAddress.toLowerCase() as Address)) {
    return true;
  }

  return false;
}

// const serverClient = getWalletClient({ chainId: builderNftChain.id, privateKey: builderSmartContractMinterKey });

// const apiClient = new BuilderNFTSeasonOneClient({
//   chain: builderNftChain,
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
