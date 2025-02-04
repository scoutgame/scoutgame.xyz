import { jest } from '@jest/globals';
import { getWalletClient } from '@packages/blockchain/getWalletClient';
import { createContext } from '@packages/testing/koa/context';
import { generatePrivateKey } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

jest.unstable_mockModule('@packages/utils/http', () => ({
  POST: jest.fn()
}));

const privateKey = generatePrivateKey();

const client = getWalletClient({
  chainId: baseSepolia.id,
  privateKey
});

jest.unstable_mockModule('@packages/scoutgame/builderNfts/constants', () => ({
  builderNftChain: { id: 1 },
  builderSmartContractMinterKey: privateKey
}));

jest.unstable_mockModule('../getWalletGasBalanceInUSD', () => ({
  getWalletGasBalanceInUSD: jest.fn()
}));

const { POST } = await import('@packages/utils/http');
const { getWalletGasBalanceInUSD } = await import('../getWalletGasBalanceInUSD');
const { alertLowWalletGasBalance } = await import('../index');

const discordWebhook = 'https://discord.webhook.url';

describe('alertLowWalletGasBalance', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const walletAddress = client.account.address;

  it('should call the webhook when balance is below threshold', async () => {
    (getWalletGasBalanceInUSD as jest.Mock<typeof getWalletGasBalanceInUSD>).mockResolvedValue(20); // Below threshold of 25

    await alertLowWalletGasBalance(createContext(), discordWebhook);

    expect(getWalletGasBalanceInUSD).toHaveBeenCalledWith(walletAddress);
    expect(POST).toHaveBeenCalledWith(
      discordWebhook,
      expect.objectContaining({
        content: expect.any(String)
      })
    );
  });

  it('should not call the webhook when balance is above threshold', async () => {
    (getWalletGasBalanceInUSD as jest.Mock<typeof getWalletGasBalanceInUSD>).mockResolvedValue(30); // Above threshold of 25

    await alertLowWalletGasBalance(createContext(), discordWebhook);

    expect(getWalletGasBalanceInUSD).toHaveBeenCalledWith(walletAddress);
    expect(POST).not.toHaveBeenCalled();
  });

  it('should throw an error if no discord webhook is provided', async () => {
    await expect(alertLowWalletGasBalance(createContext())).rejects.toThrow('No Discord webhook found');
  });
});
