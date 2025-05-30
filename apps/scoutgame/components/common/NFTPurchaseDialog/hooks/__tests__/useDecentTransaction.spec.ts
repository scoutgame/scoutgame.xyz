import { jest } from '@jest/globals';
import { getStarterNFTContractAddress } from '@packages/scoutgame/builderNfts/constants';
import { renderHook, waitFor } from '@testing-library/react';
import { v4 as uuid } from 'uuid';
import { baseSepolia } from 'viem/chains';

import type { DecentTransactionProps } from '../useDecentTransaction';

jest.unstable_mockModule('@packages/utils/http', () => ({
  GET: jest.fn()
}));

const mockOptimismUsdcContractAddress = '0x0b2c639c533813f4aa9d7837caf62653d097ff85';

// Scout protocol info
const mockScoutTokenAddress = '0xa5a71c88478894077650f27dd7b14fdabe3a03f0';
const mockScoutProtocolChainId = baseSepolia.id;

jest.unstable_mockModule('@packages/utils/constants', () => ({
  decentApiKey: '123'
}));

jest.unstable_mockModule('@packages/blockchain/constants', () => ({
  OPTIMISM_USDC_ADDRESS: mockOptimismUsdcContractAddress
}));

jest.unstable_mockModule('@packages/scoutgame/protocol/constants', () => ({
  scoutProtocolChainId: mockScoutProtocolChainId,
  devTokenContractAddress: mockScoutTokenAddress
}));

describe('useDecentTransaction', () => {
  const address = '0xc0ffee254729296a45a3885639AC7E10F9d54979';
  const tokenAddress = mockScoutTokenAddress; // '0x0b2c639c533813f4aa9d7837caf62653d097ff85';

  it('should always use a contract address that was provided', async () => {
    const { GET: mockGET } = await import('@packages/utils/http');

    (mockGET as jest.Mock<any>).mockResolvedValueOnce({
      data: {
        action: '0x123'
      }
    });

    const { useDecentTransaction, _appendDecentQueryParams } = await import('../useDecentTransaction');

    const contractAddress = '0x11111106cb9dbdc32e08c3d230889acb9fe8a4dd';

    const testInput: DecentTransactionProps = {
      address,
      builderTokenId: BigInt(1),
      paymentAmountOut: BigInt(1),
      sourceChainId: 10,
      sourceToken: tokenAddress,
      tokensToPurchase: BigInt(1),
      contractAddress,
      isStarterContract: false
    };

    const { result } = renderHook(() => useDecentTransaction(testInput));

    await waitFor(() => {
      expect(result.current.isLoadingDecentSdk).toBe(false);
    });

    expect(mockGET).toHaveBeenCalledWith(
      _appendDecentQueryParams('https://box-v3-2-0.api.decent.xyz/api/getBoxAction', {
        arguments: {
          sender: testInput.address,
          srcToken: testInput.sourceToken,
          dstToken: mockScoutTokenAddress,
          srcChainId: testInput.sourceChainId,
          dstChainId: mockScoutProtocolChainId,
          slippage: 1,
          actionType: 'nft-mint',
          actionConfig: {
            chainId: mockScoutProtocolChainId,
            contractAddress,
            cost: {
              amount: '1n',
              isNative: false,
              tokenAddress
            },
            signature: 'function mint(address account, uint256 tokenId, uint256 amount)',
            args: [address, `${testInput.builderTokenId.toString()}n`, `${testInput.tokensToPurchase.toString()}n`]
          }
        }
      }),
      undefined,
      {
        headers: expect.any(Object),
        credentials: 'omit'
      }
    );
  });

  it('should use a scoutId based signature when the contract address is a starter pack address', async () => {
    const { GET: mockGET } = await import('@packages/utils/http');

    const scoutId = uuid();

    (mockGET as jest.Mock<any>).mockResolvedValueOnce({
      data: {
        action: '0x123'
      }
    });

    const { useDecentTransaction, _appendDecentQueryParams } = await import('../useDecentTransaction');

    const contractAddress = getStarterNFTContractAddress('2025-W02')!;

    const testInput: DecentTransactionProps = {
      address,
      builderTokenId: BigInt(1),
      paymentAmountOut: BigInt(1),
      sourceChainId: 10,
      sourceToken: tokenAddress,
      tokensToPurchase: BigInt(1),
      contractAddress,
      isStarterContract: true,
      scoutId
    };

    const { result } = renderHook(() => useDecentTransaction(testInput));

    await waitFor(() => {
      expect(result.current.isLoadingDecentSdk).toBe(false);
    });

    expect(mockGET).toHaveBeenCalledWith(
      _appendDecentQueryParams('https://box-v3-2-0.api.decent.xyz/api/getBoxAction', {
        arguments: {
          sender: testInput.address,
          srcToken: testInput.sourceToken,
          dstToken: mockScoutTokenAddress,
          srcChainId: testInput.sourceChainId,
          dstChainId: mockScoutProtocolChainId,
          slippage: 1,
          actionType: 'nft-mint',
          actionConfig: {
            chainId: mockScoutProtocolChainId,
            contractAddress,
            cost: {
              amount: '1n',
              isNative: false,
              tokenAddress
            },
            signature: 'function mint(address account, uint256 tokenId, uint256 amount, string memory scoutId)',
            args: [
              address,
              `${testInput.builderTokenId.toString()}n`,
              `${testInput.tokensToPurchase.toString()}n`,
              scoutId
            ]
          }
        }
      }),
      undefined,
      {
        headers: expect.any(Object),
        credentials: 'omit'
      }
    );
  });
});
