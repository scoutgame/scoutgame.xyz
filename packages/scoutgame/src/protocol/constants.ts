import env from '@beam-australia/react-env';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import type { Address } from 'viem';
import { base } from 'viem/chains';

import { LockupWeeklyStreamCreatorClient } from '../builderNfts/clients/protocol/wrappers/LockupWeeklyStreamCreatorClient';
import { ScoutProtocolBuilderNFTImplementationClient } from '../builderNfts/clients/protocol/wrappers/ScoutProtocolBuilderNFTImplementation';
import { ScoutTokenERC20ImplementationClient } from '../builderNfts/clients/protocol/wrappers/ScoutTokenERC20Implementation';
import { getBuilderNftContractAddress } from '../builderNfts/constants';

export const sablierLockupContractAddress = process.env.SABLIER_LOCKUP_CONTRACT_ADDRESS as Address;

export const sablierStreamId = process.env.SABLIER_STREAM_ID as Address;

export const scoutProtocolChain = base;

export const scoutProtocolChainId = scoutProtocolChain.id;

export const scoutTokenDecimals = 18;

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

export function getScoutProtocolBuilderNFTContract() {
  if (!scoutProtocolBuilderNftContractAddress) {
    throw new Error('REACT_APP_BUILDER_NFT_CONTRACT_ADDRESS is not set');
  }

  const builderNFTContract = new ScoutProtocolBuilderNFTImplementationClient({
    chain: scoutProtocolChain,
    contractAddress: getBuilderNftContractAddress(getCurrentSeasonStart()),
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

export function scoutTokenErc20ContractAddress() {
  return (
    (env('SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS') as Address) ||
    (process.env.REACT_APP_SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS as Address)
  );
}

export function getScoutTokenERC20Contract() {
  const contractAddress = scoutTokenErc20ContractAddress();

  if (!contractAddress) {
    throw new Error('REACT_APP_SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS is not set');
  }

  const tokenContract = new ScoutTokenERC20ImplementationClient({
    chain: scoutProtocolChain,
    contractAddress,
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
