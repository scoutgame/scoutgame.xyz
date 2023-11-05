import type { TokenPayload } from 'google-auth-library';

import { googleOAuthClientId } from 'config/constants';
import { coerceToMilliseconds } from 'lib/utilities/dates';
import { InvalidInputError, UnauthorisedActionError } from 'lib/utilities/errors';

import type { GoogleLoginOauthParams } from './authorization/authClient';
import { getClient } from './authorization/authClient';

// https://developers.google.com/people/quickstart/nodejs
export async function verifyGoogleToken(idToken: string, oauthParams?: GoogleLoginOauthParams): Promise<TokenPayload> {
  const authClient = getClient(oauthParams?.redirectUri);
  const ticket = await authClient.verifyIdToken({
    idToken,
    audience: oauthParams?.audience || googleOAuthClientId
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new InvalidInputError('Invalid Google authentication token');
  }
  // console.log('payload', payload);

  const now = Date.now();
  const { exp } = payload;

  const hasExpired = coerceToMilliseconds(exp) < now;
  if (hasExpired) {
    throw new UnauthorisedActionError('Authentication token has expired. Please try again.');
  }
  return payload;
}
