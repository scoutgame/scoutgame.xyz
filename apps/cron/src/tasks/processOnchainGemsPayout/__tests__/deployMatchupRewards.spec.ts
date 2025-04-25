import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { optimismTokenDecimals } from '@packages/blockchain/constants';
import { mockBuilder, mockScout, mockMatchup, mockBuilderEvent, mockUserWeeklyStats } from '@packages/testing/database';
import { parseUnits } from 'viem';
import { optimism } from 'viem/chains';

jest.unstable_mockModule('@packages/blockchain/airdrop/createThirdwebAirdropContract', () => ({
  createThirdwebAirdropContract: jest.fn()
}));

const { createThirdwebAirdropContract } = await import('@packages/blockchain/airdrop/createThirdwebAirdropContract');
const { deployMatchupRewards } = await import('../../processOnchainGemsPayout/deployMatchupRewards');

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

    expect(createThirdwebAirdropContract).toHaveBeenCalled();

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
    expect(payout.rewardPayouts[0].amount).toBe(parseUnits('60', optimismTokenDecimals).toString());

    const builderEvent = await prisma.builderEvent.findFirstOrThrow({
      where: {
        week: mockWeek,
        type: 'matchup_winner'
      }
    });

    expect(builderEvent.builderId).toBe(scout.id);
  });

  it('should skip deployment if no recipients are found', async () => {
    await deployMatchupRewards({ week: '2025-W04' });

    // Verify no deployment or DB writes happened
    expect(createThirdwebAirdropContract).not.toHaveBeenCalled();
  });
});
