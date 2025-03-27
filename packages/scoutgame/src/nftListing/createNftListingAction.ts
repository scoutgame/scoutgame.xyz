'use server';

import type { OrderWithCounter } from '@opensea/seaport-js/lib/types';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { createNftListing } from './createNftListing';

const createNftListingSchema = yup.object({
  builderNftId: yup.string().required(),
  price: yup.number().required(),
  amount: yup.number().required(),
  order: yup.object().required(),
  sellerWallet: yup.string().required()
});

export const createNftListingAction = authActionClient
  .metadata({
    actionName: 'create-nft-listing'
  })
  .schema(createNftListingSchema)
  .action(async ({ parsedInput, ctx }) => {
    const scoutId = ctx.session.scoutId;

    const { builderNftId, price, amount, order, sellerWallet } = parsedInput;

    await createNftListing({
      builderNftId,
      price,
      amount,
      order: order as OrderWithCounter,
      scoutId,
      sellerWallet
    });

    revalidatePath(`/profile`);

    return {
      success: true
    };
  });
