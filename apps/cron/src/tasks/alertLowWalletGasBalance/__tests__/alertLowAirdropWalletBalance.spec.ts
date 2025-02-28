import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getCurrentWeek } from '@packages/dates/utils';
import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerReward/getBuilderEventsForPartnerReward';
import { getReferralsToReward } from '@packages/scoutgame/quests/getReferralsToReward';
import { getNewScoutRewards } from '@packages/scoutgame/scouts/getNewScoutRewards';
import { formatUnits, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { sendDiscordAlert } from '../../../utils/sendDiscordAlert';
import { alertLowAirdropWalletBalance } from '../alertLowAirdropWalletBalance';

// Mock dependencies
jest.mock('@charmverse/core/log');
jest.mock('@charmverse/core/prisma-client');
jest.mock('@packages/blockchain/getPublicClient');
jest.mock('@packages/dates/utils');
jest.mock('@packages/scoutgame/partnerReward/getBuilderEventsForPartnerReward');
jest.mock('@packages/scoutgame/quests/getReferralsToReward');
jest.mock('@packages/scoutgame/scouts/getNewScoutRewards');
jest.mock('viem');
jest.mock('viem/accounts');
jest.mock('../../../utils/sendDiscordAlert');

describe('alertLowAirdropWalletBalance', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    // Set up mock private keys
    process.env.REFERRAL_CHAMPION_REWARD_ADMIN_PRIVATE_KEY = '0xreferral_champion_private_key';
    process.env.NEW_SCOUT_REWARD_ADMIN_PRIVATE_KEY = '0xnew_scout_private_key';
    process.env.OCTANT_BASE_CONTRIBUTION_REWARD_ADMIN_PRIVATE_KEY = '0xoctant_private_key';

    // Mock getCurrentWeek
    (getCurrentWeek as jest.Mock).mockReturnValue('2023-W01');

    // Mock formatUnits and parseUnits
    (formatUnits as jest.Mock).mockImplementation((value) => {
      return (Number(value) / 1e18).toString();
    });

    (parseUnits as jest.Mock).mockImplementation((value, _decimals) => {
      return BigInt(Number(value) * 1e18);
    });

    // Mock privateKeyToAccount
    (privateKeyToAccount as jest.Mock).mockImplementation((privateKey) => {
      const addressMap: Record<string, string> = {
        '0xreferral_champion_private_key': '0xreferral_champion_address',
        '0xnew_scout_private_key': '0xnew_scout_address',
        '0xoctant_private_key': '0xoctant_address'
      };

      return {
        address: addressMap[privateKey] || '0xunknown_address'
      };
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('should check wallet balances and alert for low balances', async () => {
    // Mock prisma.partnerRewardPayoutContract.findFirst for each partner
    (prisma.partnerRewardPayoutContract.findFirst as jest.Mock).mockImplementation(({ where }) => {
      const partner = where.partner;
      return {
        tokenAddress: '0xtoken_address',
        chainId: 10, // Optimism
        tokenSymbol: 'OP',
        tokenDecimals: 18
      };
    });

    // Mock getPublicClient
    const mockReadContract = jest.fn();
    (getPublicClient as jest.Mock).mockReturnValue({
      readContract: mockReadContract
    });

    // Mock wallet balances - first partner has low balance
    mockReadContract.mockImplementation(({ args }) => {
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
    (getReferralsToReward as jest.Mock).mockResolvedValue([
      { address: '0xuser1', opAmount: 40 },
      { address: '0xuser2', opAmount: 40 }
    ]);

    // Mock getNewScoutRewards
    (getNewScoutRewards as jest.Mock).mockResolvedValue([
      { address: '0xuser3', opAmount: 50 },
      { address: '0xuser4', opAmount: 50 }
    ]);

    // Mock getBuilderEventsForPartnerRewards
    (getBuilderEventsForPartnerRewards as jest.Mock).mockResolvedValue([
      { githubUser: { builder: { wallets: [{ address: '0xuser5' }] } } },
      { githubUser: { builder: { wallets: [{ address: '0xuser6' }] } } }
    ]);

    await alertLowAirdropWalletBalance();

    // Verify that sendDiscordAlert was called for the first partner (low balance)
    expect(sendDiscordAlert).toHaveBeenCalledTimes(1);
    expect(sendDiscordAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '🚨 Low Airdrop Wallet Balance Alert',
        description: expect.stringContaining('optimism_referral_champion'),
        fields: expect.arrayContaining([
          { name: 'Wallet', value: '0xreferral_champion_address' },
          { name: 'Current Balance', value: '50 OP' },
          { name: 'Required for Airdrop', value: '80 OP' },
          { name: 'Shortfall', value: '30 OP' },
          { name: 'Week', value: '2023-W01' }
        ])
      })
    );

    // Verify logs
    expect(log.info).toHaveBeenCalledWith('Starting alertLowAirdropWalletBalance task');
    expect(log.info).toHaveBeenCalledWith('Checking wallet balance for partner: optimism_referral_champion');
    expect(log.warn).toHaveBeenCalledWith(
      expect.stringContaining('Low wallet balance for partner: optimism_referral_champion')
    );
    expect(log.info).toHaveBeenCalledWith('Wallet balance is sufficient for partner: optimism_new_scout');
    expect(log.info).toHaveBeenCalledWith('Completed alertLowAirdropWalletBalance task');
  });

  test('should handle missing private key', async () => {
    // Remove private key from env
    delete process.env.REFERRAL_CHAMPION_REWARD_ADMIN_PRIVATE_KEY;

    await alertLowAirdropWalletBalance();

    // Verify warning log
    expect(log.warn).toHaveBeenCalledWith(
      'Missing private key for partner: optimism_referral_champion. Environment variable REFERRAL_CHAMPION_REWARD_ADMIN_PRIVATE_KEY not set.'
    );
  });

  test('should handle missing token information', async () => {
    // Mock prisma.partnerRewardPayoutContract.findFirst to return null for the first partner
    (prisma.partnerRewardPayoutContract.findFirst as jest.Mock).mockImplementation(({ where }) => {
      const partner = where.partner;
      if (partner === 'optimism_referral_champion') {
        return null;
      }
      return {
        tokenAddress: '0xtoken_address',
        chainId: 10,
        tokenSymbol: 'OP',
        tokenDecimals: 18
      };
    });

    await alertLowAirdropWalletBalance();

    // Verify warning log
    expect(log.warn).toHaveBeenCalledWith('Missing token information for partner: optimism_referral_champion');
  });

  test('should handle errors when fetching wallet balance', async () => {
    // Mock prisma.partnerRewardPayoutContract.findFirst
    (prisma.partnerRewardPayoutContract.findFirst as jest.Mock).mockResolvedValue({
      tokenAddress: '0xtoken',
      chainId: 10,
      tokenSymbol: 'OP',
      tokenDecimals: 18
    });

    // Mock getPublicClient to throw an error
    const mockReadContract = jest.fn().mockRejectedValue(new Error('RPC error'));
    (getPublicClient as jest.Mock).mockReturnValue({
      readContract: mockReadContract
    });

    // Mock empty rewards
    (getReferralsToReward as jest.Mock).mockResolvedValue([]);
    (getNewScoutRewards as jest.Mock).mockResolvedValue([]);
    (getBuilderEventsForPartnerRewards as jest.Mock).mockResolvedValue([]);

    await alertLowAirdropWalletBalance();

    // Verify error log
    expect(log.error).toHaveBeenCalledWith('Error fetching wallet token balance:', { error: expect.any(Error) });
  });
});
