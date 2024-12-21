import env from '@beam-australia/react-env';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import { LockupWeeklyStreamCreatorClient } from '@packages/scoutgame/builderNfts/clients/LockupWeeklyStreamCreatorClient';
import { ScoutProtocolBuilderNFTImplementationClient } from '@packages/scoutgame/builderNfts/clients/ScoutProtocolBuilderNFTImplementationClient';
import { ScoutTokenERC20Client } from '@packages/scoutgame/builderNfts/clients/ScoutTokenERC20Client';
import type { Address } from 'viem';
import { baseSepolia } from 'viem/chains';

export const sablierLockupContractAddress = process.env.SABLIER_LOCKUP_CONTRACT_ADDRESS as Address;

export const sablierStreamId = process.env.SABLIER_STREAM_ID as Address;

export const scoutProtocolChain = baseSepolia;

export const scoutProtocolChainId = scoutProtocolChain.id;

export const scoutTokenDecimals = 18;

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

export function getScoutProtocolBuilderNFTContract() {
  const contractAddress = scoutProtocolBuilderNftContractAddress();

  if (!contractAddress) {
    throw new Error('REACT_APP_SCOUT_PROTOCOL_BUILDER_NFT_CONTRACT_ADDRESS is not set');
  }

  const builderNFTContract = new ScoutProtocolBuilderNFTImplementationClient({
    chain: scoutProtocolChain,
    contractAddress,
    walletClient: getScoutAdminWalletClient()
  });

  return builderNFTContract;
}

export function getScoutProtocolBuilderNFTReadonlyContract() {
  const contractAddress = scoutProtocolBuilderNftContractAddress();

  if (!contractAddress) {
    throw new Error('REACT_APP_SCOUT_PROTOCOL_BUILDER_NFT_CONTRACT_ADDRESS is not set');
  }

  const builderNFTContract = new ScoutProtocolBuilderNFTImplementationClient({
    chain: scoutProtocolChain,
    contractAddress,
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

  const tokenContract = new ScoutTokenERC20Client({
    chain: scoutProtocolChain,
    contractAddress,
    walletClient: getScoutAdminWalletClient()
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

export function scoutProtocolBuilderNftContractAddress() {
  return (
    (env('SCOUT_PROTOCOL_BUILDER_NFT_CONTRACT_ADDRESS') as Address) ||
    (process.env.REACT_APP_SCOUT_PROTOCOL_BUILDER_NFT_CONTRACT_ADDRESS as Address)
  );
}
