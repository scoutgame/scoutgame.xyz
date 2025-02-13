'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import { optimism } from 'viem/chains';

import { scoutgameMintsLogger } from '../loggers/mintsLogger';

import { getPreSeasonTwoBuilderNftContractReadonlyClient } from './clients/preseason02/getPreSeasonTwoBuilderNftContractReadonlyClient';
import { getBuilderNftStarterPackReadonlyClient } from './clients/starterPack/getBuilderContractStarterPackReadonlyClient';
import { getBuilderNftContractAddress, getBuilderNftStarterPackContractAddress } from './constants';
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

    // TODO: use the correct client for the season when we move to $SCOUT
    const currentPrice = await (parsedInput.nftType === 'starter_pack'
      ? getBuilderNftStarterPackReadonlyClient({
          chain: optimism,
          contractAddress: getBuilderNftStarterPackContractAddress(getCurrentSeasonStart())
        }).getTokenPurchasePrice({
          args: { amount: BigInt(parsedInput.amount) }
        })
      : getPreSeasonTwoBuilderNftContractReadonlyClient({
          chain: optimism,
          contractAddress: getBuilderNftContractAddress(getCurrentSeasonStart())
        }).getTokenPurchasePrice({
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
