'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { purchaseNftListing } from './purchaseNftListing';

const purchaseNftListingSchema = yup.object({
  listingId: yup.string().required('Listing ID is required'),
  buyerWallet: yup
    .string()
    .required('Buyer wallet address is required')
    .test('is-valid-address', 'Invalid wallet address', (value) => isAddress(value)),
  txHash: yup.string().required('Transaction hash is required'),
  txLogIndex: yup.number().required('Transaction log index is required')
});

export const purchaseNftListingAction = authActionClient
  .metadata({
    actionName: 'purchase-nft-listing'
  })
  .schema(purchaseNftListingSchema)
  .action(async ({ parsedInput, ctx }) => {
    const scoutId = ctx.session.scoutId;

    const { listingId, buyerWallet, txHash, txLogIndex } = parsedInput;

    const result = await purchaseNftListing({
      listingId,
      buyerWallet,
      txHash,
      txLogIndex,
      scoutId
    });

    return {
      success: true,
      listing: result.listing,
      purchaseEvent: result.purchaseEvent
    };
  });
