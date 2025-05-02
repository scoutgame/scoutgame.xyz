import { jest } from '@jest/globals';

jest.unstable_mockModule('@charmverse/core/prisma-client', () => ({
  prisma: {
    partnerRewardPayoutContract: {
      findFirst: jest.fn()
    }
  }
}));

jest.unstable_mockModule('@packages/blockchain/getPublicClient', () => ({
  getPublicClient: jest.fn()
}));

jest.unstable_mockModule('@packages/scoutgame/partnerRewards/getBuilderEventsForPartnerReward', () => ({
  getBuilderEventsForPartnerRewards: jest.fn()
}));

jest.unstable_mockModule('@packages/scoutgame/quests/getReferralsToReward', () => ({
  getReferralsToReward: jest.fn()
}));

jest.unstable_mockModule('viem/accounts', () => ({
  privateKeyToAccount: jest.fn()
}));

jest.unstable_mockModule('@packages/discord/sendDiscordAlert', () => ({
  sendDiscordAlert: jest.fn()
}));

// Import mocked modules after mocking
const { prisma } = await import('@charmverse/core/prisma-client');
const { getPublicClient } = await import('@packages/blockchain/getPublicClient');
const { getCurrentWeek } = await import('@packages/dates/utils');
const { getBuilderEventsForPartnerRewards } = await import(
  '@packages/scoutgame/partnerRewards/getBuilderEventsForPartnerReward'
);
const { getReferralsToReward } = await import('@packages/scoutgame/quests/getReferralsToReward');
const { privateKeyToAccount } = await import('viem/accounts');
const { sendDiscordAlert } = await import('@packages/discord/sendDiscordAlert');

// Import the function to test after all mocks are set up
const { alertLowAirdropWalletBalance } = await import('../alertLowAirdropWalletBalance');

describe('alertLowAirdropWalletBalance', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    // Set up mock private keys
    process.env.REFERRAL_CHAMPION_REWARD_ADMIN_PRIVATE_KEY = '0xreferral_champion_private_key';
    process.env.NEW_SCOUT_REWARD_ADMIN_PRIVATE_KEY = '0xnew_scout_private_key';
    process.env.OCTANT_BASE_CONTRIBUTION_REWARD_ADMIN_PRIVATE_KEY = '0xoctant_private_key';

    // Mock privateKeyToAccount
    (privateKeyToAccount as jest.Mock).mockImplementation((privateKey: unknown) => {
      const addressMap = {
        '0xreferral_champion_private_key': '0xreferral_champion_address',
        '0xnew_scout_private_key': '0xnew_scout_address',
        '0xoctant_private_key': '0xoctant_address'
      };

      return {
        address: addressMap[privateKey as keyof typeof addressMap] || '0xunknown_address'
      };
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('should check wallet balances and alert for low balances', async () => {
    (prisma.partnerRewardPayoutContract.findFirst as jest.Mock<typeof prisma.partnerRewardPayoutContract.findFirst>)
      // @ts-ignore
      .mockImplementation(async () => {
        return Promise.resolve({
          tokenAddress: '0xtoken_address',
          chainId: 10, // Optimism
          tokenSymbol: 'OP',
          rewardPayouts: [],
          tokenDecimals: 18
        });
      });

    // Mock getPublicClient
    const mockReadContract = jest.fn();
    (getPublicClient as jest.Mock<typeof getPublicClient>).mockReturnValue({
      readContract: mockReadContract
    } as unknown as ReturnType<typeof getPublicClient>);

    // @ts-ignore Mock wallet balances - first partner has low balance
    (mockReadContract as jest.Mock<typeof mockReadContract>).mockImplementation(({ args }: { args: string[] }) => {
      const walletAddress = args[0];
      if (walletAddress === '0xreferral_champion_address') {
        return BigInt(50 * 1e18); // 50 OP
      } else if (walletAddress === '0xnew_scout_address') {
        return BigInt(200 * 1e18); // 200 OP
      } else {
        return BigInt(100 * 1e18); // 100 OP
      }
    });

    // Mock getReferralsToReward
    (getReferralsToReward as jest.Mock<typeof getReferralsToReward>).mockResolvedValue([
      { address: '0xuser1', opAmount: 40 },
      { address: '0xuser2', opAmount: 40 }
    ] as unknown as Awaited<ReturnType<typeof getReferralsToReward>>);

    // Mock getBuilderEventsForPartnerRewards
    (getBuilderEventsForPartnerRewards as jest.Mock<typeof getBuilderEventsForPartnerRewards>).mockResolvedValue([
      { githubUser: { builder: { wallets: [{ address: '0xuser5' }] } } },
      { githubUser: { builder: { wallets: [{ address: '0xuser6' }] } } }
    ] as unknown as Awaited<ReturnType<typeof getBuilderEventsForPartnerRewards>>);

    await alertLowAirdropWalletBalance();

    // Verify that sendDiscordAlert was called for the first partner (low balance)
    expect(sendDiscordAlert).toHaveBeenCalledTimes(2);
  });
});
