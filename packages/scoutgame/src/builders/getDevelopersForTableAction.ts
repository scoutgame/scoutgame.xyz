'use server';

import { actionClient } from '@packages/nextjs/actions/actionClient';
import * as yup from 'yup';

import type { DeveloperMetadata, DevelopersSortBy, DeveloperTableCursor } from './getDevelopersForTable';
import { getDevelopersForTable } from './getDevelopersForTable';

export type GetDevelopersForTableActionParams = {
  limit?: number;
  sortBy?: DevelopersSortBy;
  order?: 'asc' | 'desc';
  nftType: 'default' | 'starter';
  cursor?: DeveloperTableCursor;
};

export type GetDevelopersForTableActionResult = {
  developers: DeveloperMetadata[];
  nextCursor: DeveloperTableCursor | null;
};

export const getDevelopersForTableAction = actionClient
  .metadata({ actionName: 'get_developers_table' })
  .schema(
    yup.object({
      cursor: yup.object().nullable(),
      sortBy: yup.string().oneOf(['price', 'week_gems', 'level', 'estimated_payout']).required(),
      order: yup.string().oneOf(['asc', 'desc']).required(),
      nftType: yup.string().oneOf(['default', 'starter']).required()
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const scoutId = ctx.session.scoutId;

    const { developers, nextCursor } = await getDevelopersForTable({
      ...parsedInput,
      cursor: (parsedInput.cursor as DeveloperTableCursor) || undefined,
      loggedInScoutId: scoutId
    });

    return { data: developers, nextCursor };
  });
