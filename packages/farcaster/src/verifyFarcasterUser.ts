import { createAppClient, viemConnector } from '@farcaster/auth-client';

import { authConfig } from './config';
import type { AuthSchema } from './config';

const appClient = createAppClient({
  ethereum: viemConnector({
    rpcUrl: authConfig.rpcUrl
  })
});

export async function verifyFarcasterUser({ nonce, message, signature }: AuthSchema): Promise<{ fid: number }> {
  const {
    success,
    fid,
    error: farcasterSignatureError
  } = await appClient.verifySignInMessage({
    nonce,
    message,
    signature,
    domain: authConfig.domain,
    acceptAuthAddress: true
  });

  if (farcasterSignatureError) {
    throw new Error(farcasterSignatureError.message || 'Invalid signature');
  } else if (!success) {
    throw new Error('Invalid signature');
  }

  return { fid };
}
