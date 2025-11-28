import { jest } from '@jest/globals';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

jest.unstable_mockModule('@packages/utils/http', () => ({
  POST: jest.fn()
}));

jest.unstable_mockModule('@packages/blockchain/getEthPrice', () => ({
  getEthPrice: jest.fn()
}));

const privateKey = generatePrivateKey();
const walletAddress = privateKeyToAccount(privateKey).address;

jest.unstable_mockModule('@packages/scoutgame/builderNfts/constants', () => ({
  nftChain: { id: 1 },
  minterPrivateKey: privateKey
}));

const { POST } = await import('@packages/utils/http');
const { getEthPrice } = await import('@packages/blockchain/getEthPrice');
const { getWalletGasBalanceInUSD } = await import('../getWalletGasBalanceInUSD');

describe('getWalletGasBalanceInUSD', () => {
  it('should return $25 when balance and price are set accordingly', async () => {
    // Mock the POST request to Alchemy API
    (POST as jest.Mock<typeof POST>).mockResolvedValue({
      result: '0x3635c9adc5dea00000' // 1000000000000000000000 wei (1000 ETH)
    });

    // Mock the getEthPrice function
    (getEthPrice as jest.Mock<typeof getEthPrice>).mockResolvedValue(0.025); // $0.025 per ETH

    const balance = await getWalletGasBalanceInUSD(walletAddress, 'test-api-key');

    expect(balance).toBeCloseTo(25, 2); // $25 with 2 decimal places precision
    expect(POST).toHaveBeenCalledWith(
      expect.stringContaining('https://base-mainnet.g.alchemy.com/v2/test-api-key'),
      expect.any(Object)
    );
    expect(getEthPrice).toHaveBeenCalled();
  });
});
