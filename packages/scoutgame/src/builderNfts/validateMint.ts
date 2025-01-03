import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { parseEventLogs } from 'viem';

import { builderContractReadonlyApiClient } from './clients/builderContractReadClient';

type MintValidation = {
  scoutId: string;
  tokenId: number;
  tokensMinted: number;
};

<<<<<<<< HEAD:packages/scoutgame/src/builderNfts/validatePreseason01orStarterPackMint.ts
export async function validatePreseason01orStarterPackMint({
========
export async function validateMint({
>>>>>>>> f8eda4458986a6fbfacb32ff08140c06327f0cdc:packages/scoutgame/src/builderNfts/validateMint.ts
  txHash,
  chainId
}: {
  txHash: string;
  chainId: number;
}): Promise<MintValidation | null> {
  const onchainEvent = await getPublicClient(chainId).waitForTransactionReceipt({
    hash: txHash as `0x${string}`
  });

  const builderScoutedEvent = parseEventLogs({
    abi: builderContractReadonlyApiClient.abi,
    logs: onchainEvent.logs,
    eventName: ['BuilderScouted']
  })[0];

  const transferSingleEvent = parseEventLogs({
    abi: builderContractReadonlyApiClient.abi,
    logs: onchainEvent.logs,
    eventName: ['BuilderScouted']
  })[0];

  if (!builderScoutedEvent || !transferSingleEvent) {
    return null;
  }

  return {
    scoutId: builderScoutedEvent.args.scout,
    tokenId: Number(builderScoutedEvent.args.tokenId),
    tokensMinted: Number(builderScoutedEvent.args.amount)
  };
}
