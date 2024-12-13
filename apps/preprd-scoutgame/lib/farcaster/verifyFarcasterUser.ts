import { createAppClient, verifySignInMessage, viemConnector } from '@farcaster/auth-client';
import { optimism } from 'viem/chains';

import { getAuthConfig } from './config';
import type { AuthSchema } from './config';

const appClient = createAppClient({
  ethereum: viemConnector({
    rpcUrl: optimism.rpcUrls.default.http[0]
  })
});

export async function verifyFarcasterUser({ nonce, message, signature }: AuthSchema): Promise<{ fid: number }> {
  const authConfig = getAuthConfig();

  const {
    success,
    fid,
    error: farcasterSignatureError
  } = await verifySignInMessage(appClient, {
    nonce,
    message,
    signature,
    domain: authConfig.domain
  });

  if (farcasterSignatureError) {
    throw new Error(farcasterSignatureError.message || 'Invalid signature');
  } else if (!success) {
    throw new Error('Invalid signature');
  }

  return { fid };
}
