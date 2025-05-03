import type { MockBuilder } from '@packages/testing/database';
import { mockBuilder, mockBuilderNft } from '@packages/testing/database';
import { randomWalletAddress } from '@packages/testing/generators';
import { v4 as uuid } from 'uuid';
import { parseUnits } from 'viem';

import { devTokenDecimals } from '../../protocol/constants';
import type { TokenDistribution } from '../divideTokensBetweenDeveloperAndHolders';
import { divideTokensBetweenDeveloperAndHolders } from '../divideTokensBetweenDeveloperAndHolders';

describe('divideTokensBetweenDeveloperAndHolders', () => {
  let builder: MockBuilder;
  let builderNft: Awaited<ReturnType<typeof mockBuilderNft>>;
  let starterPackNft: Awaited<ReturnType<typeof mockBuilderNft>>;

  const season = 'season-1';

  const rank = 1;
  const weeklyAllocatedTokens = parseUnits('100000', devTokenDecimals);
  const normalisationFactor = BigInt(80);
  const normalisationScale = BigInt(100);

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
    const result = divideTokensBetweenDeveloperAndHolders({
      rank,
      weeklyAllocatedTokens,
      normalisationFactor,
      normalisationScale,
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
        earnableTokens: parseUnits('2400', devTokenDecimals),
        tokensPerScoutByWallet: expect.arrayContaining<TokenDistribution['tokensPerScoutByWallet'][number]>([
          { wallet: userAddress1, nftTokens: 10, erc20Tokens: parseUnits('1119', devTokenDecimals) },
          { wallet: userAddress2, nftTokens: 5, erc20Tokens: parseUnits('800', devTokenDecimals) }
        ]),
        tokensPerScoutByScoutId: expect.arrayContaining<TokenDistribution['tokensPerScoutByScoutId'][number]>([
          { scoutId: userId1, nftTokens: 10, erc20Tokens: parseUnits('1119', devTokenDecimals) },
          { scoutId: userId2, nftTokens: 5, erc20Tokens: parseUnits('800', devTokenDecimals) }
        ]),
        tokensForDeveloper: parseUnits('480', devTokenDecimals)
      })
    );

    const totalTokensDistributed = result.tokensPerScoutByWallet.reduce(
      (acc, scout) => acc + scout.erc20Tokens,
      BigInt(0)
    );
    expect(totalTokensDistributed + result.tokensForDeveloper).toBeLessThanOrEqual(result.earnableTokens);
  });

  it('should throw an error if rank is invalid', async () => {
    expect(() =>
      divideTokensBetweenDeveloperAndHolders({
        rank: -1,
        weeklyAllocatedTokens,
        normalisationFactor,
        normalisationScale,
        owners: {
          byScoutId: [],
          byWallet: []
        }
      })
    ).toThrow('Invalid rank provided. Must be a number greater than 0');
  });
});
