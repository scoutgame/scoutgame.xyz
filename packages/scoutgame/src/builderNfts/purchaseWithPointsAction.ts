'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { getPlatform, isOnchainPlatform } from '@packages/utils/platform';
import { revalidatePath } from 'next/cache';

import { scoutgameMintsLogger } from '../loggers/mintsLogger';
import { scoutTokenDecimals } from '../protocol/constants';

import { getBuilderNftContractReadonlyClient } from './clients/builderNftContractReadonlyClient';
import { getBuilderNftStarterPackReadonlyClient } from './clients/starterPack/getBuilderContractStarterPackReadonlyClient';
import { mintNFT } from './mintNFT';
import { schema } from './purchaseWithPointsSchema';
import { convertCostToPoints } from './utils';

const platform = getPlatform();

export const purchaseWithPointsAction = authActionClient
  .metadata({ actionName: 'purchase_with_points' })
  .schema(schema)
  .action(async ({ ctx, parsedInput }) => {
    const [builderNft, scout] = await Promise.all([
      prisma.builderNft.findFirstOrThrow({
        where: {
          builderId: parsedInput.builderId,
          season: getCurrentSeasonStart(),
          nftType: parsedInput.nftType,
          builder: {
            deletedAt: null
          }
        }
      }),
      prisma.scout.findFirstOrThrow({
        where: {
          id: ctx.session.scoutId,
          deletedAt: null
        },
        select: {
          currentBalance: true
        }
      })
    ]);

    if (!builderNft) {
      throw new Error('Builder NFT not found');
    }

    if (!scout) {
      throw new Error('Scout not found');
    }

    const currentPrice = await (parsedInput.nftType === 'starter_pack'
      ? getBuilderNftStarterPackReadonlyClient().getTokenPurchasePrice({
          args: { amount: BigInt(parsedInput.amount) }
        })
      : getBuilderNftContractReadonlyClient().getTokenPurchasePrice({
          args: { tokenId: BigInt(builderNft.tokenId), amount: BigInt(parsedInput.amount) }
        }));

    const isOnchain = isOnchainPlatform();

    const currentPriceInScoutToken = Number(builderNft?.currentPriceInScoutToken || 0) / 10 ** scoutTokenDecimals;
    const pointsValue = isOnchain ? currentPriceInScoutToken : convertCostToPoints(currentPrice);

    if (
      (isOnchain && scout.currentBalance < currentPriceInScoutToken) ||
      (!isOnchain && scout.currentBalance < pointsValue)
    ) {
      throw new Error('Insufficient points');
    }

    scoutgameMintsLogger.info(`Triggering ${parsedInput.nftType} NFT mint via admin wallet`, {
      builderNftId: builderNft.id,
      recipientAddress: parsedInput.recipientAddress,
      amount: parsedInput.amount,
      scoutId: ctx.session.scoutId,
      pointsValue,
      nftType: parsedInput.nftType
    });
    await mintNFT({
      builderNftId: builderNft.id,
      recipientAddress: parsedInput.recipientAddress,
      amount: parsedInput.amount,
      scoutId: ctx.session.scoutId as string,
      paidWithPoints: true,
      pointsValue,
      nftType: parsedInput.nftType
    });

    revalidatePath('/', 'layout');
    return { success: true };
  });
