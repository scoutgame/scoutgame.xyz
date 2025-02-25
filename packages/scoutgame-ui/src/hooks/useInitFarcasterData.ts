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

      const targetPath = getNextPageLink({ onboarded: data.onboarded });
      router.push(targetPath);

      let retries = 0;

      // Wait for navigation to complete
      const retryPromise = new Promise<void>((resolve) => {
        const checkNavigation = () => {
          // Get current pathname directly from window.location
          const currentPath = window.location.pathname;
          // If we're not on the home page, we're done or we've retried too many times
          if (currentPath !== '/' || retries > 10) {
            resolve();
          } else {
            retries += 1;
            setTimeout(checkNavigation, 1000);
          }
        };

        checkNavigation();
      });

      await retryPromise;
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
