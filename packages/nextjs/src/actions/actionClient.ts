import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { headers } from 'next/headers';
import { createSafeActionClient } from 'next-safe-action';
import { yupAdapter } from 'next-safe-action/adapters/yup';
import * as yup from 'yup';

import { getSession } from '../session/getSession';

import { handleReturnedServerError, handleServerErrorLog } from './onError';

export function defineMetadataSchema() {
  return yup.object({
    actionName: yup.string()
  }) as yup.ObjectSchema<{ actionName: string }>;
}

export const actionClientBase = createSafeActionClient({
  validationAdapter: yupAdapter(),
  defineMetadataSchema,
  handleServerError: async (err, utils) => {
    await handleServerErrorLog(err, utils);
    return handleReturnedServerError(err, utils);
  },
  defaultValidationErrorsShape: 'flattened'
});

export const actionClient = actionClientBase
  /**
   * Middleware used for auth purposes.
   * Returns the context with the session object.
   */
  .use(async ({ next }) => {
    const session = await getSession();
    const headerList = await headers();

    return next({
      ctx: { session, headers: headerList }
    });
  });

export const authActionClient = actionClient.use(async ({ next, ctx }) => {
  const scoutId = ctx.session.adminId || ctx.session.scoutId;

  if (!scoutId) {
    throw new UnauthorisedActionError('You are not logged in. Please try to login');
  }

  await prisma.scout.findUniqueOrThrow({
    where: { id: scoutId },
    select: { id: true }
  });

  return next({ ctx: { ...ctx, session: { ...ctx.session, scoutId } } });
});
