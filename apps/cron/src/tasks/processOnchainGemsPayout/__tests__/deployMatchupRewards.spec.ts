import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { optimismTokenDecimals } from '@packages/blockchain/constants';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { mockBuilder, mockMatchup, mockScout, mockUserWeeklyStats } from '@packages/testing/database';
import { parseUnits } from 'viem';

jest.unstable_mockModule('@packages/blockchain/airdrop/createThirdwebAirdropContract', () => ({
  createThirdwebAirdropContract: jest.fn()
}));

const { createThirdwebAirdropContract } = await import('@packages/blockchain/airdrop/createThirdwebAirdropContract');
const { deployMatchupRewards } = await import('../deployMatchupRewards');

describe('deployMatchupRewards', () => {
  const mockAirdropAddress = '0x123AirdropContractAddress';
  const mockDeployTxHash = '0x456DeployTxHash';
  const mockMerkleTree = { root: '0x789MerkleRoot' } as any;
  const mockBlockNumber = BigInt(12345);

  const mockRecipients = [
    {
      scoutId: 'scout1',
      address: '0xRecipient1Address',
      opAmount: 10,
      pointsAmount: 1000
    },
    {
      scoutId: 'scout2',
      address: '0xRecipient2Address',
      opAmount: 5,
      pointsAmount: 500
    }
  ];

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    (createThirdwebAirdropContract as jest.Mock<typeof createThirdwebAirdropContract>).mockResolvedValue({
      airdropContractAddress: mockAirdropAddress,
      deployTxHash: mockDeployTxHash,
      merkleTree: mockMerkleTree,
      blockNumber: mockBlockNumber
    });
  });

  it('should save leaderboard, deploy contract, save payout data, and create builder events when recipients exist', async () => {
    const mockWeek = '2025-W03';
    const builder = await mockBuilder({ createNft: true });
    const scout = await mockScout({ builderId: builder.id });
    await mockMatchup({
      createdBy: scout.id,
      week: mockWeek,
      submittedAt: new Date(),
      selectedNfts: [builder.regularNft!.id]
    });

    await mockUserWeeklyStats({
      userId: builder.id,
      week: mockWeek,
      gemsCollected: 26
    });

    await deployMatchupRewards({ week: mockWeek });

    expect(createThirdwebAirdropContract).toHaveBeenCalledTimes(2);

    const matchup = await prisma.scoutMatchup.findFirstOrThrow({
      where: {
        createdBy: scout.id
      }
    });
    expect(matchup.totalScore).toBe(26);
    expect(matchup.rank).toBe(1);

    const payout = await prisma.partnerRewardPayoutContract.findFirstOrThrow({
      where: {
        week: mockWeek,
        partner: 'matchup_rewards'
      },
      include: {
        rewardPayouts: true
      }
    });

    expect(payout.rewardPayouts.length).toBe(1);
    // First place payout is 60 OP
    expect(payout.rewardPayouts[0].amount).toBe(parseUnits('60', optimismTokenDecimals).toString());

    const devPayout = await prisma.partnerRewardPayoutContract.findFirstOrThrow({
      where: {
        week: mockWeek,
        partner: 'matchup_pool_rewards'
      },
      include: {
        rewardPayouts: true
      }
    });

    expect(devPayout.rewardPayouts.length).toBe(1);
    // First place is 100 DEV for a single-user matchup (First place payout is 50% of pool, with 80% of fees going to the pool)
    expect(devPayout.rewardPayouts[0].amount).toBe(parseUnits('100', devTokenDecimals).toString());
  });

  it('should skip deployment if no recipients are found', async () => {
    await deployMatchupRewards({ week: '2025-W04' });

    // Verify no deployment or DB writes happened
    expect(createThirdwebAirdropContract).not.toHaveBeenCalled();
  });
});
