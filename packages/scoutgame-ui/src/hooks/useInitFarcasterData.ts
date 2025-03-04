import { log } from '@charmverse/core/log';
import sdk from '@farcaster/frame-sdk';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { loginWithWalletAction } from '@packages/scoutgame/session/loginWithWalletAction';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect } from 'react';

import { useUser } from '../providers/UserProvider';

import { useLoginSuccessHandler } from './useLoginSuccessHandler';

export function useInitFarcasterData() {
  const router = useRouter();
  const { getNextPageLink } = useLoginSuccessHandler();
  const { refreshUser, user } = useUser();
  const { executeAsync: revalidatePath } = useAction(revalidatePathAction);

  const { executeAsync: loginUser } = useAction(loginWithWalletAction, {
    onSuccess: async ({ data }) => {
      if (!data?.success) {
        log.error('Error on farcaster frames login', { error: new Error('Farcaster frames login failed') });
        return;
      }

      await refreshUser();

      await revalidatePath();

      const targetPath = getNextPageLink({ onboarded: data.onboarded });

      log.info('Farcaster frames login successful', { userId: data.user.id, targetPath });

      router.push(targetPath);
    },
    onError(err) {
      log.error('Error on farcaster frames login', { error: err.error.serverError });
    }
  });

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      // If context is not present we are not inside a farcaster client
      if (!context) {
        return;
      }

      // Immediately signal that the frame is ready and hide the splash screen
      await sdk.actions.ready({});
      // If the user is not logged in, auto trigger wallet login
      if (!user) {
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

      if (!context.client.added) {
        await sdk.actions.addFrame();
      }
    };

    if (sdk) {
      load();
    }
  }, [user, loginUser]);
}
