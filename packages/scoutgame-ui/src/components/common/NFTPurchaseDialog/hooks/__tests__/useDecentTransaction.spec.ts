import { jest } from '@jest/globals';
import { usdcOptimismMainnetContractAddress } from '@packages/scoutgame/builderNfts/constants';
import { renderHook, waitFor } from '@testing-library/react';
import { baseSepolia, optimism } from 'viem/chains';

import type { DecentTransactionProps } from '../useDecentTransaction';

jest.unstable_mockModule('@packages/utils/http', () => ({
  GET: jest.fn()
}));

const mockBuilderContractAddress = '0x1d305a06cb9dbdc32e08c3d230889acb9fe8a4dd';
const mockScoutProtocolBuilderNftContractAddress = '0x5ba1cf70b94592e21ff1b68b3c0e68c0c2279865';
const mockScoutProtocolAddress = '0x5ba1cf70b94592e21ff1b68b3c0e68c0c2279865';
const mockScoutTokenAddress = '0xa5a71c88478894077650f27dd7b14fdabe3a03f0';
const mockScoutProtocolChainId = baseSepolia.id;

const mockBuilderNftChain = optimism;

jest.unstable_mockModule('@packages/scoutgame/builderNfts/constants', () => ({
  realOptimismMainnetBuildersContract: '0x1d305a06cb9dbdc32e08c3d230889acb9fe8a4dd',
  optimismUsdcContractAddress: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
  builderNftChain: mockBuilderNftChain,
  getDecentApiKey: jest.fn(() => '123'),
  getBuilderContractAddress: jest.fn(() => mockBuilderContractAddress)
}));

jest.unstable_mockModule('@packages/scoutgame/protocol/constants', () => ({
  getScoutProtocolAddress: jest.fn(() => mockScoutProtocolAddress),
  scoutProtocolBuilderNftContractAddress: jest.fn(() => mockScoutProtocolBuilderNftContractAddress),
  scoutProtocolChainId: mockScoutProtocolChainId,
  scoutTokenErc20ContractAddress: jest.fn(() => mockScoutTokenAddress)
}));

describe('useDecentTransaction', () => {
  const address = '0xc0ffee254729296a45a3885639AC7E10F9d54979';
  const contractAddress = '0x1d305a06cb9dbdc32e08c3d230889acb9fe8a4dd';
  const tokenAddress = '0x0b2c639c533813f4aa9d7837caf62653d097ff85';

  // beforeEach(() => {
  //   jest.clearAllMocks();
  // });

  it('should pass the correct contract address when useScoutToken is false', async () => {
    const { GET: mockGET } = await import('@packages/utils/http');

    (mockGET as jest.Mock<any>).mockResolvedValueOnce({
      data: {
        action: '0x123'
      }
    });

    const { useDecentTransaction, _appendDecentQueryParams } = await import('../useDecentTransaction');

    const testInput: DecentTransactionProps = {
      address,
      builderTokenId: BigInt(1),
      paymentAmountOut: BigInt(1),
      sourceChainId: 10,
      sourceToken: tokenAddress,
      tokensToPurchase: BigInt(1),
      contractAddress,
      useScoutToken: false
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
          dstToken: usdcOptimismMainnetContractAddress,
          srcChainId: testInput.sourceChainId,
          dstChainId: mockBuilderNftChain.id,
          slippage: 1,
          actionType: 'nft-mint',
          actionConfig: {
            chainId: mockBuilderNftChain.id,
            contractAddress,
            cost: {
              amount: '1n',
              isNative: false,
              tokenAddress
            },
            signature: 'function mint(address account, uint256 tokenId, uint256 amount, string scout)',
            args: [
              address,
              `${testInput.builderTokenId.toString()}n`,
              `${testInput.tokensToPurchase.toString()}n`,
              null
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

  it('should pass the correct contract address when useScoutToken is true', async () => {
    const { GET: mockGET } = await import('@packages/utils/http');

    (mockGET as jest.Mock<any>).mockResolvedValueOnce({
      data: {
        action: '0x123'
      }
    });

    const { useDecentTransaction, _appendDecentQueryParams } = await import('../useDecentTransaction');

    const testInput: DecentTransactionProps = {
      address,
      builderTokenId: BigInt(1),
      paymentAmountOut: BigInt(1),
      sourceChainId: 10,
      sourceToken: tokenAddress,
      tokensToPurchase: BigInt(1),
      // Important bit
      useScoutToken: true
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
            contractAddress: mockScoutProtocolBuilderNftContractAddress,
            cost: {
              amount: '1n',
              isNative: false,
              tokenAddress: mockScoutTokenAddress
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
});
