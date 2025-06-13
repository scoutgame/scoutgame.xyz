import type { BoxActionRequest } from '@decent.xyz/box-common';
import { ActionType } from '@decent.xyz/box-common';
import { useBoxAction } from '@decent.xyz/box-hooks';
import { devTokenContractAddress, scoutProtocolChainId } from '@packages/scoutgame/protocol/constants';
import { bigIntToString } from '@packages/utils/numbers';
import type { Address } from 'viem';

export type DecentTransactionProps = {
  address: Address;
  sourceChainId: number;
  sourceToken: Address;
  paymentAmountOut: bigint;
  builderTokenId: bigint;
  tokensToPurchase: bigint;
  scoutId?: string;
  contractAddress: string;
  isStarterContract: boolean;
};

const transferableNftMintSignature = 'function mint(address account, uint256 tokenId, uint256 amount)';
const transferableStarterNftMintSignature =
  'function mint(address account, uint256 tokenId, uint256 amount, string memory scoutId)';

export function useDecentTransaction({
  address,
  paymentAmountOut,
  sourceChainId,
  sourceToken,
  builderTokenId,
  scoutId,
  tokensToPurchase,
  contractAddress,
  isStarterContract
}: DecentTransactionProps) {
  const decentAPIParams: BoxActionRequest = {
    sender: address as `0x${string}`,
    srcToken: sourceToken,
    dstToken: devTokenContractAddress,
    srcChainId: sourceChainId,
    dstChainId: scoutProtocolChainId,
    slippage: 1,
    actionType: ActionType.NftMint,
    actionConfig: {
      chainId: scoutProtocolChainId,
      contractAddress,
      cost: {
        amount: bigIntToString(paymentAmountOut) as any,
        isNative: false,
        tokenAddress: devTokenContractAddress
      },
      signature: isStarterContract ? transferableStarterNftMintSignature : transferableNftMintSignature,
      args: isStarterContract
        ? [address, bigIntToString(builderTokenId), bigIntToString(tokensToPurchase), scoutId]
        : [address, bigIntToString(builderTokenId), bigIntToString(tokensToPurchase)]
    }
  };

  const {
    actionResponse: decentTransactionInfo,
    isLoading: isLoadingDecentSdk,
    error: decentSdkError
  } = useBoxAction({
    actionConfig: decentAPIParams.actionConfig,
    actionType: ActionType.NftMint,
    dstChainId: scoutProtocolChainId,
    srcChainId: sourceChainId,
    srcToken: sourceToken,
    dstToken: devTokenContractAddress,
    sender: address,
    slippage: 1,
    enable:
      !!address &&
      !!paymentAmountOut &&
      !!sourceChainId &&
      !!sourceToken &&
      !!devTokenContractAddress &&
      !!scoutProtocolChainId
  });

  return {
    decentSdkError,
    isLoadingDecentSdk,
    decentTransactionInfo
  };
}
