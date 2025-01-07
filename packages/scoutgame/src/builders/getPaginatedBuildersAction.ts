'use server';

import { actionClient } from '@packages/nextjs/actions/actionClient';
import * as yup from 'yup';

import { getCurrentWeek } from '../dates/utils';

import type { CompositeCursor } from './getPaginatedBuilders';
import { getPaginatedBuilders } from './getPaginatedBuilders';
import type { BuilderInfo } from './interfaces';

export const getPaginatedBuildersAction = actionClient
  .metadata({ actionName: 'get_paginated_builders' })
  .schema(
    yup.object({
      cursor: yup
        .object({
          userId: yup.string().required(),
          rank: yup.number().nullable()
        })
        .nullable()
    })
  )
  .action<{ builders: BuilderInfo[]; nextCursor: CompositeCursor | null }>(async ({ parsedInput }) => {
    const { cursor } = parsedInput;
    const { builders, nextCursor } = await getPaginatedBuilders({
      limit: 30, // 6 rows per page
      week: getCurrentWeek(),
      cursor
    });

    return { builders, nextCursor };
  });
