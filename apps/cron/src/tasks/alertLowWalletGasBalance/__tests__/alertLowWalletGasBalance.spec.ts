import { jest } from '@jest/globals';
import { createContext } from '@packages/testing/koa/context';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

jest.unstable_mockModule('@packages/utils/http', () => ({
  POST: jest.fn()
}));

const privateKey = generatePrivateKey();
const walletAddress = privateKeyToAccount(privateKey).address;

jest.unstable_mockModule('@packages/scoutgame/builderNfts/constants', () => ({
  nftChain: { id: 1 },
  validMintNftPurchaseEvent: {
    id: 'mock-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    eventType: 'mock-event-type',
    eventData: {}
  }
}));

jest.unstable_mockModule('@packages/scoutgame/protocol/constants', () => ({
  minterPrivateKey: privateKey,
  weeklyRewardableBuilders: 100
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

  it('should call the webhook when balance is below threshold', async () => {
    (getWalletGasBalanceInUSD as jest.Mock<typeof getWalletGasBalanceInUSD>).mockResolvedValue(10); // Below threshold of 25

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
