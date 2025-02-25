import { log } from '@charmverse/core/log';
import sdk from '@farcaster/frame-sdk';
import { loginWithWalletAction } from '@packages/scoutgame/session/loginWithWalletAction';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect } from 'react';

import { useLoginSuccessHandler } from './useLoginSuccessHandler';

export function useInitFarcasterData() {
  const router = useRouter();
  const { getNextPageLink } = useLoginSuccessHandler();

  const { executeAsync: loginUser } = useAction(loginWithWalletAction, {
    onSuccess: async ({ data }) => {
      if (!data?.success) {
        return;
      }

      router.push(getNextPageLink({ onboarded: data?.onboarded }));
    },
    onError(err) {
      log.error('Error on login', { error: err.error.serverError });
    }
  });

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      // If context is not present we are not inside a farcaster client
      if (context) {
        const nonce = Math.random().toString(36).substring(2, 10);
        const { signature, message } = await sdk.actions.signIn({
          nonce,
          // 1 hour expiration time
          expirationTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        });
        // Auto login user if they have a wallet connected
        await loginUser({
          signature,
          message
        });

        await sdk.actions.ready({});
      }
    };

    if (sdk) {
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, []);
}
