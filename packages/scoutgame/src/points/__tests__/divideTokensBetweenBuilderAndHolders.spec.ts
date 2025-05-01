import type { MockBuilder } from '@packages/testing/database';
import { mockBuilder, mockBuilderNft } from '@packages/testing/database';
import { randomWalletAddress } from '@packages/testing/generators';
import { v4 as uuid } from 'uuid';

import type { TokenDistribution } from '../divideTokensBetweenDeveloperAndHolders';
import { divideTokensBetweenBuilderAndHolders } from '../divideTokensBetweenDeveloperAndHolders';

describe('divideTokensBetweenBuilderAndHolders', () => {
  let builder: MockBuilder;
  let builderNft: Awaited<ReturnType<typeof mockBuilderNft>>;
  let starterPackNft: Awaited<ReturnType<typeof mockBuilderNft>>;

  const season = 'season-1';

  const rank = 1;
  const weeklyAllocatedTokens = 100_000;
  const normalisationFactor = 0.8;

  const userId1 = uuid();
  const userId2 = uuid();

  const userAddress1 = randomWalletAddress();
  const userAddress2 = randomWalletAddress();

  beforeAll(async () => {
    builder = await mockBuilder();

    builderNft = await mockBuilderNft({ builderId: builder.id, season });
    starterPackNft = await mockBuilderNft({ builderId: builder.id, season, nftType: 'starter_pack' });
  });

  // Success Cases
  it('should correctly distribute tokens among scouts and builder, counting normal NFTs as 10x compared to starter pack NFTs', async () => {
    const result = divideTokensBetweenBuilderAndHolders({
      builderId: builder.id,
      rank,
      weeklyAllocatedTokens,
      normalisationFactor,
      owners: {
        byWallet: [
          {
            totalNft: 10,
            totalStarter: 0,
            wallet: userAddress1
          },
          {
            totalNft: 5,
            totalStarter: 2,
            wallet: userAddress2
          }
        ],
        byScoutId: [
          {
            totalNft: 10,
            totalStarter: 0,
            scoutId: userId1
          },
          {
            totalNft: 5,
            totalStarter: 2,
            scoutId: userId2
          }
        ]
      }
    });

    expect(result).toMatchObject<TokenDistribution>(
      expect.objectContaining<TokenDistribution>({
        nftSupply: {
          default: 15,
          starterPack: 2,
          total: 17
        },
        earnableScoutTokens: 2400,
        tokensPerScoutByWallet: expect.arrayContaining<TokenDistribution['tokensPerScoutByWallet'][number]>([
          { wallet: userAddress1, nftTokens: 10, erc20Tokens: 1119 },
          { wallet: userAddress2, nftTokens: 5, erc20Tokens: 800 }
        ]),
        tokensPerScoutByScoutId: expect.arrayContaining<TokenDistribution['tokensPerScoutByScoutId'][number]>([
          { scoutId: userId1, nftTokens: 10, erc20Tokens: 1119 },
          { scoutId: userId2, nftTokens: 5, erc20Tokens: 800 }
        ]),
        tokensForBuilder: 480
      })
    );

    const totalTokensDistributed = result.tokensPerScoutByWallet.reduce((acc, scout) => acc + scout.erc20Tokens, 0);
    expect(totalTokensDistributed + result.tokensForBuilder).toBeLessThanOrEqual(result.earnableScoutTokens);
  });

  // Error Cases
  it('should throw an error if builderId is invalid', async () => {
    expect(() =>
      divideTokensBetweenBuilderAndHolders({
        builderId: 'invalid-builder-id',
        rank,
        weeklyAllocatedTokens,
        normalisationFactor,
        owners: {
          byScoutId: [],
          byWallet: []
        }
      })
    ).toThrow('Invalid builderId must be a valid UUID');
  });

  it('should throw an error if rank is invalid', async () => {
    expect(() =>
      divideTokensBetweenBuilderAndHolders({
        builderId: builder.id,
        rank: -1,
        weeklyAllocatedTokens,
        normalisationFactor,
        owners: {
          byScoutId: [],
          byWallet: []
        }
      })
    ).toThrow('Invalid rank provided. Must be a number greater than 0');
  });
});
