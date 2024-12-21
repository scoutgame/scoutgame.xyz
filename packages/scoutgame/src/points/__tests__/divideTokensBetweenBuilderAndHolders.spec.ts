import { InvalidInputError } from '@charmverse/core/errors';
import { generateRandomEthAddress } from '@packages/testing/random';

import type { MockBuilder } from '../../testing/database';
import { mockBuilder, mockBuilderNft } from '../../testing/database';
import type { TokenDistribution } from '../divideTokensBetweenBuilderAndHolders';
import { divideTokensBetweenBuilderAndHolders } from '../divideTokensBetweenBuilderAndHolders';

describe('divideTokensBetweenBuilderAndHolders', () => {
  let builder: MockBuilder;
  let builderNft: Awaited<ReturnType<typeof mockBuilderNft>>;
  let starterPackNft: Awaited<ReturnType<typeof mockBuilderNft>>;

  const season = 'season-1';

  const rank = 1;
  const weeklyAllocatedTokens = 100_000;
  const normalisationFactor = 0.8;

  const userAddress1 = generateRandomEthAddress();
  const userAddress2 = generateRandomEthAddress();

  beforeAll(async () => {
    builder = await mockBuilder();

    builderNft = await mockBuilderNft({ builderId: builder.id, season });
    starterPackNft = await mockBuilderNft({ builderId: builder.id, season, nftType: 'starter_pack' });
  });

  // Success Cases
  it('should correctly distribute tokens among scouts and builder, counting normal NFTs as 10x compared to starter pack NFTs', async () => {
    const result = await divideTokensBetweenBuilderAndHolders({
      builderId: builder.id,
      rank,
      weeklyAllocatedTokens,
      normalisationFactor,
      owners: [
        {
          tokens: { default: 10, starter_pack: 0 },
          wallet: userAddress1
        },
        {
          tokens: { default: 5, starter_pack: 0 },
          wallet: userAddress2
        }
      ]
    });

    expect(result).toMatchObject<TokenDistribution>(
      expect.objectContaining<TokenDistribution>({
        nftSupply: {
          default: 15,
          starterPack: 0,
          total: 0
        },
        earnableScoutTokens: 2400,
        tokensPerScout: expect.arrayContaining<TokenDistribution['tokensPerScout'][number]>([
          { wallet: userAddress1, nftTokens: 10, erc20Tokens: 1280 },
          { wallet: userAddress2, nftTokens: 5, erc20Tokens: 640 }
        ]),
        tokensForBuilder: 480
      })
    );

    const totalTokensDistributed = result.tokensPerScout.reduce((acc, scout) => acc + scout.erc20Tokens, 0);
    expect(totalTokensDistributed + result.tokensForBuilder).toBeLessThanOrEqual(result.earnableScoutTokens);
  });

  // Error Cases
  it('should throw an error if builderId is invalid', async () => {
    await expect(
      divideTokensBetweenBuilderAndHolders({
        builderId: 'invalid-builder-id',
        rank,
        weeklyAllocatedTokens,
        normalisationFactor,
        owners: []
      })
    ).rejects.toThrow(InvalidInputError);
  });

  it('should throw an error if rank is invalid', async () => {
    await expect(
      divideTokensBetweenBuilderAndHolders({
        builderId: builder.id,
        rank: -1,
        weeklyAllocatedTokens,
        normalisationFactor,
        owners: []
      })
    ).rejects.toThrow('Invalid rank provided');
  });
});
