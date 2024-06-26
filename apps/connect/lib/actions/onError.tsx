import { DataNotFoundError, SystemError, UnknownError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { getIronSession } from 'iron-session';
import { headers, cookies } from 'next/headers';

import type { SessionData } from 'lib/session/config';
import { getIronOptions } from 'lib/session/getIronOptions';

const validationProps: (keyof SystemError)[] = ['errorType', 'message', 'severity', 'code'];

export async function handleServerError(err: any) {
  // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
  // P2025 is thrown when a record is not found
  if (err.code === 'P2025') {
    const error = new DataNotFoundError('Data not found');

    return {
      message: error.message,
      errorType: error.errorType,
      severity: error.severity,
      status: error.code
    };
  }

  const session = await getIronSession<SessionData>(cookies(), getIronOptions());
  const userId = session.user?.id;

  const headersList = headers();
  const fullUrl = headersList.get('referer') || '';

  // We need to change strategy to validate the error since Prototypes are not always correct
  const isValidSystemError =
    validationProps.every((prop) => !!err[prop]) && typeof err.code === 'number' && err.code >= 400 && err.code <= 599;

  const errorAsSystemError = isValidSystemError ? err : new UnknownError(err.stack ?? err.error ?? err);

  if (errorAsSystemError.code === 500) {
    log.error(`Server Error: ${err.message || err.error?.message || err.error || err}`, {
      // err.error?.message is for errors from @charmverse/core/http
      error: err instanceof SystemError === false ? err.message || 'Something went wrong' : errorAsSystemError,
      stack: err.error?.stack || err.stack,
      userId,
      projectId: '',
      url: fullUrl,
      body: undefined
    });
  } else {
    log.warn(`Client Error: ${errorAsSystemError.message}`, {
      url: fullUrl,
      userId,
      projectId: '', // @TODO Add projectId when it's ready
      body: undefined
    });
  }

  return { message: err.message, severity: err.severity, status: err.code, type: err.errorType };
}
