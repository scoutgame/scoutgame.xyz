'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { revalidatePath } from 'next/cache';

import { authActionClient } from '../actions/actionClient';
import { getCurrentSeasonStart } from '../dates/utils';
import { scoutgameMintsLogger } from '../loggers/mintsLogger';

import { builderContractReadonlyApiClient } from './clients/builderContractReadClient';
import { builderContractStarterPackReadonlyApiClient } from './clients/builderContractStarterPackReadClient';
import { mintNFT } from './mintNFT';
import { schema } from './purchaseWithPointsSchema';
import { convertCostToPoints } from './utils';

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
      ? builderContractStarterPackReadonlyApiClient.getTokenPurchasePrice({
          args: { amount: BigInt(parsedInput.amount) }
        })
      : builderContractReadonlyApiClient.getTokenPurchasePrice({
          args: { tokenId: BigInt(builderNft.tokenId), amount: BigInt(parsedInput.amount) }
        }));

    const pointsValue = convertCostToPoints(currentPrice);
    if (scout.currentBalance < pointsValue) {
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
