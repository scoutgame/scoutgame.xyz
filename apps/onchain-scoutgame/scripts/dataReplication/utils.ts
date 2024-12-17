import { getWalletClient } from "@packages/blockchain/getWalletClient";
import { Address } from "viem";
import { baseSepolia } from "viem/chains";
import { ScoutProtocolBuilderNFTImplementationClient } from "@packages/scoutgame/builderNfts/clients/ScoutProtocolBuilderNFTImplementationClient";

export function validateIsNotProductionDatabase() {
  if (!process.env.DATABASE_URL?.match('stg-app') && !process.env.DATABASE_URL?.match('127.0.0.1') && !process.env.DATABASE_URL?.match('localhost')) {
    throw new Error('This script is only meant to be run on local, staging or preprod database');
  }
}

export function scoutProtocolBuilderNftContractAddress() {
  return process.env.SCOUT_PROTOCOL_BUILDER_NFT_CONTRACT_ADDRESS as Address;
}


export function getScoutProtocolBuilderNFTContract() {

  const key = process.env.SCOUT_PROTOCOL_BUILDER_NFT_ADMIN_KEY as string;

  if (!key) {
    throw new Error('SCOUT_PROTOCOL_BUILDER_NFT_ADMIN_KEY is not set');
  }

  const contractAddress = scoutProtocolBuilderNftContractAddress();

  if (!contractAddress) {
    throw new Error('SCOUT_PROTOCOL_BUILDER_NFT_CONTRACT_ADDRESS is not set');
  }

  const walletClient = getWalletClient({
    chainId: baseSepolia.id,
    privateKey: key
  });

  const builderNFTContract = new ScoutProtocolBuilderNFTImplementationClient({
    chain: baseSepolia,
    contractAddress,
    walletClient
  });

  return builderNFTContract;
}