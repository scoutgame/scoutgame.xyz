'use server';

import { getCurrentWeek } from '@packages/dates/utils';
import { actionClient } from '@packages/nextjs/actions/actionClient';
import * as yup from 'yup';

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
  .action<{ builders: BuilderInfo[]; nextCursor: CompositeCursor | null }>(async ({ parsedInput, ctx }) => {
    const scoutId = ctx.session.adminId || ctx.session.scoutId;

    const { cursor } = parsedInput;
    const { builders, nextCursor } = await getPaginatedBuilders({
      limit: 30, // 6 rows per page
      week: getCurrentWeek(),
      cursor,
      scoutId
    });

    return { builders, nextCursor };
  });
