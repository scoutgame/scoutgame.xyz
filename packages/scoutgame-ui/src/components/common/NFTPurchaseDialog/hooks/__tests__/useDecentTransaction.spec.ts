import { jest } from '@jest/globals';
import { usdcOptimismMainnetContractAddress } from '@packages/scoutgame/builderNfts/constants';
import { renderHook, waitFor } from '@testing-library/react';

import type { DecentTransactionProps } from '../useDecentTransaction';

jest.unstable_mockModule('@packages/utils/http', () => ({
  GET: jest.fn()
}));

const { GET: mockGET } = await import('@packages/utils/http');

describe('useDecentTransaction', () => {
  // Recipient address
  const address = '0xc0ffee254729296a45a3885639AC7E10F9d54979';
  // Builder contract address
  const contractAddress = '0x1d305a06cb9dbdc32e08c3d230889acb9fe8a4dd';

  // USDC address
  const tokenAddress = '0x0b2c639c533813f4aa9d7837caf62653d097ff85';

  test('should pass the correct contract address', async () => {
    const { useDecentTransaction, _appendDecentQueryParams } = await import('../useDecentTransaction');

    const testInput: DecentTransactionProps = {
      address,
      builderTokenId: BigInt(1),
      paymentAmountOut: BigInt(1),
      sourceChainId: 10,
      sourceToken: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
      tokensToPurchase: BigInt(1),
      contractAddress
    };

    const { result } = renderHook(() => useDecentTransaction(testInput));

    // We don't need to test the actual API call, just ensure that the function is called
    (mockGET as jest.Mock<any>).mockResolvedValueOnce({
      data: {
        action: '0x123'
      }
    });

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
          dstChainId: 10,
          slippage: 1,
          actionType: 'nft-mint',
          actionConfig: {
            chainId: 10,
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
});
