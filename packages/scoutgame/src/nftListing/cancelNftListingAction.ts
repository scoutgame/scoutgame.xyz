'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { cancelNftListing } from './updateNftListing';

const cancelNftListingSchema = yup.object({
  listingId: yup.string().required()
});

export const cancelNftListingAction = authActionClient
  .metadata({
    actionName: 'cancel-nft-listing'
  })
  .schema(cancelNftListingSchema)
  .action(async ({ parsedInput, ctx }) => {
    const scoutId = ctx.session.scoutId;
    const { listingId } = parsedInput;

    await cancelNftListing({ listingId, scoutId });

    revalidatePath(`/profile`);

    return { success: true };
  });
