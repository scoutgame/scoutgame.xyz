'use server';

import type { OrderWithCounter } from '@opensea/seaport-js/lib/types';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { recordNftListing } from './recordNftListing';

const recordNftListingSchema = yup.object({
  builderNftId: yup.string().required(),
  price: yup.number().required(),
  amount: yup.number().required(),
  order: yup.object().required(),
  sellerWallet: yup.string().required()
});

export const recordNftListingAction = authActionClient
  .metadata({
    actionName: 'create-nft-listing'
  })
  .schema(recordNftListingSchema)
  .action(async ({ parsedInput, ctx }) => {
    const scoutId = ctx.session.scoutId;

    const { builderNftId, price, amount, order, sellerWallet } = parsedInput;

    await recordNftListing({
      builderNftId,
      price,
      amount,
      order: order as OrderWithCounter,
      scoutId,
      sellerWallet
    });

    trackUserAction('list_nft', {
      developerNftId: builderNftId,
      price,
      userId: scoutId
    });

    revalidatePath(`/profile`);

    return {
      success: true
    };
  });
