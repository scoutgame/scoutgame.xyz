'use server';

import { actionClient } from '@packages/nextjs/actions/actionClient';
import * as yup from 'yup';

import type { ScoutCursor, ScoutInfo } from './getPaginatedScouts';
import { getPaginatedScouts } from './getPaginatedScouts';

export const getPaginatedScoutsAction = actionClient
  .metadata({ actionName: 'get_paginated_scouts' })
  .schema(
    yup.object({
      cursor: yup.object().nullable(),
      sort: yup.string().optional(),
      order: yup.string().oneOf(['asc', 'desc']).optional()
    })
  )
  .action<{ data?: ScoutInfo[]; nextCursor: ScoutCursor | null }>(async ({ parsedInput }) => {
    const { cursor, sort, order } = parsedInput;

    const { scouts, nextCursor } = await getPaginatedScouts({
      sortBy: sort as any,
      order: order as 'asc' | 'desc',
      cursor: (cursor as ScoutCursor) || undefined
    });

    return { data: scouts, nextCursor };
  });
