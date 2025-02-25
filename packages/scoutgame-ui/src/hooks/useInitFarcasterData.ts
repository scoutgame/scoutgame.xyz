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
        log.error('Error on farcaster frames login', { error: new Error('Farcaster frames login failed') });
        return;
      }

      router.push(getNextPageLink({ onboarded: data?.onboarded }));
      // Wait for the router to push the page
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    },
    onError(err) {
      log.error('Error on farcaster frames login', { error: err.error.serverError });
    },
    onSettled: async () => {
      // Signal that the frame is ready and hide the splash screen, regardless of whether the login was successful or not
      await sdk.actions.ready({});
    }
  });

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      // If context is not present we are not inside a farcaster client
      if (context) {
        const { signature, message } = await sdk.actions.signIn({
          nonce: Math.random().toString(36).substring(2, 10),
          // 1 hour expiration time
          expirationTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        });
        // Auto login user if they have a wallet connected
        await loginUser({
          signature,
          message
        });
      }
    };

    if (sdk) {
      load();
    }
  }, []);
}
