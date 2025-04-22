import env from '@beam-australia/react-env';
import { DEV_TOKEN_ADDRESS } from '@packages/blockchain/constants';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import { getCurrentSeason, getCurrentSeasonStart } from '@packages/dates/utils';
import type { Address } from 'viem';
import { base, optimism } from 'viem/chains';

import { LockupWeeklyStreamCreatorClient } from '../builderNfts/clients/protocol/wrappers/LockupWeeklyStreamCreatorClient';
import { ScoutProtocolBuilderNFTImplementationClient } from '../builderNfts/clients/protocol/wrappers/ScoutProtocolBuilderNFTImplementation';
import { ScoutTokenERC20ImplementationClient } from '../builderNfts/clients/protocol/wrappers/ScoutTokenERC20Implementation';
import { getBuilderNftContractAddress, getBuilderNftStarterPackContractAddress } from '../builderNfts/constants';

export const sablierLockupContractAddress = process.env.SABLIER_LOCKUP_CONTRACT_ADDRESS as Address;

export const sablierStreamId = process.env.SABLIER_STREAM_ID as Address;

// If we are onchain or not in preseason, use base, otherwise use optimism
export const scoutProtocolChain = base; //  : optimism;

export const scoutProtocolChainId = scoutProtocolChain.id;

export const devTokenDecimals = 18;

export const protocolStartBlock = 19_000_000;

/**
 * $SCOUT has 18 decimals
 */
export const scoutTokenDecimalsMultiplier = BigInt('1000000000000000000');

export function getScoutAdminWalletClient() {
  const key = process.env.SCOUT_PROTOCOL_BUILDER_NFT_ADMIN_KEY as string;

  if (!key) {
    throw new Error('SCOUT_PROTOCOL_BUILDER_NFT_ADMIN_KEY is not set');
  }

  return getWalletClient({
    chainId: scoutProtocolChainId,
    privateKey: key
  });
}

export const scoutProtocolBuilderNftContractAddress = getBuilderNftContractAddress(getCurrentSeasonStart());
export const scoutProtocolBuilderStarterNftContractAddress =
  getBuilderNftStarterPackContractAddress(getCurrentSeasonStart());

export function getScoutProtocolBuilderNFTContract() {
  if (!scoutProtocolBuilderNftContractAddress) {
    throw new Error('REACT_APP_BUILDER_NFT_CONTRACT_ADDRESS is not set');
  }

  const contractAddress = getBuilderNftContractAddress(getCurrentSeasonStart());
  if (!contractAddress) {
    return null;
  }
  const builderNFTContract = new ScoutProtocolBuilderNFTImplementationClient({
    chain: scoutProtocolChain,
    contractAddress,
    walletClient: getScoutAdminWalletClient()
  });

  return builderNFTContract;
}

export function getScoutProtocolBuilderNFTReadonlyContract() {
  if (!scoutProtocolBuilderNftContractAddress) {
    throw new Error('REACT_APP_BUILDER_NFT_CONTRACT_ADDRESS is not set');
  }

  const builderNFTContract = new ScoutProtocolBuilderNFTImplementationClient({
    chain: scoutProtocolChain,
    contractAddress: scoutProtocolBuilderNftContractAddress,
    publicClient: getPublicClient(scoutProtocolChainId)
  });

  return builderNFTContract;
}

export function getScoutTokenERC20Contract() {
  const tokenContract = new ScoutTokenERC20ImplementationClient({
    chain: scoutProtocolChain,
    contractAddress: DEV_TOKEN_ADDRESS,
    publicClient: getPublicClient(scoutProtocolChainId)
  });

  return tokenContract;
}

export function getSablierLockupContract() {
  const contractAddress = sablierLockupContractAddress;

  if (!contractAddress) {
    throw new Error('SABLIER_LOCKUP_CONTRACT_ADDRESS is not set');
  }

  return new LockupWeeklyStreamCreatorClient({
    chain: scoutProtocolChain,
    contractAddress,
    walletClient: getScoutAdminWalletClient()
  });
}

export function getScoutProtocolAddress(): Address {
  return (env('SCOUTPROTOCOL_CONTRACT_ADDRESS') || process.env.REACT_APP_SCOUTPROTOCOL_CONTRACT_ADDRESS) as Address;
}
