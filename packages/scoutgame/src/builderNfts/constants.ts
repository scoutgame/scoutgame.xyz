import type { BuilderNftType, Prisma } from '@charmverse/core/prisma';
import type { ISOWeek } from '@packages/dates/config';
import { getSeasonConfig } from '@packages/dates/utils';
import type { Address } from 'viem';
import type { Chain } from 'viem/chains';
import { base } from 'viem/chains';

// something to differentiate between different deployments of a contract
export const getArtworkFolderPath = (season: string, isStarterNft?: boolean) =>
  isStarterNft ? getStarterNFTContractAddress(season) || 'dev_starter' : getNFTContractAddress(season) || 'dev';

export const nftChain = base;

// the "51st" dev token would cost 5100, which is impossible so we can use this as a proxy for "no price"
export const maxDevTokenPrice = 5100;

export const maxTokenSupply = 50;

export function getNFTContractAddress(season: ISOWeek): Address | undefined {
  const seasonConfig = getSeasonConfig(season);

  return seasonConfig.standardNftAddress;
}

export function getStarterNFTContractAddress(season: ISOWeek): Address | undefined {
  const seasonConfig = getSeasonConfig(season);

  return seasonConfig.starterNftAddress;
}

export function getNFTContractAddressForNftType({
  nftType,
  season
}: {
  nftType: BuilderNftType;
  season: ISOWeek;
}): Address | undefined {
  return nftType === 'starter_pack' ? getStarterNFTContractAddress(season) : getNFTContractAddress(season);
}

// Actual target wallet - Scoutgame.eth
export const scoutgameEthAddress = '0x93326D53d1E8EBf0af1Ff1B233c46C67c96e4d8D';
export const treasuryAddress = '0x4a01d4c6821ba65B36420735E2397B40Ce64EB2F';

/**
 * Sunday night on January 6th 2025
 * https://optimism.blockscout.com/block/0x89dc6ef947a3ae010ac3605e47b37826291b90781cadd294c04281a3032f6896
 */
export const lastBlockOfPreSeason01 = 130_261_411;

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
