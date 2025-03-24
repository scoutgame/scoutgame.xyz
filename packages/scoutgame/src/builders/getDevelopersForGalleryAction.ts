'use server';

import { getCurrentWeek } from '@packages/dates/utils';
import { actionClient } from '@packages/nextjs/actions/actionClient';
import * as yup from 'yup';

import type { CompositeCursor } from './getDevelopersForGallery';
import { getDevelopersForGallery } from './getDevelopersForGallery';
import type { BuilderInfo } from './interfaces';

export const getDevelopersForGalleryAction = actionClient
  .metadata({ actionName: 'get_paginated_builders' })
  .schema(
    yup.object({
      cursor: yup
        .object({
          userId: yup.string().required(),
          rank: yup.number().nullable()
        })
        .nullable(),
      nftType: yup.string().oneOf(['default', 'starter']).required()
    })
  )
  .action<{ data: BuilderInfo[]; nextCursor: CompositeCursor | null }>(async ({ parsedInput, ctx }) => {
    const scoutId = ctx.session.adminId || ctx.session.scoutId;

    const { cursor, nftType } = parsedInput;
    const { developers, nextCursor } = await getDevelopersForGallery({
      limit: 30, // 6 rows per page
      week: getCurrentWeek(),
      cursor,
      nftType,
      scoutId
    });

    return { data: developers, nextCursor };
  });
