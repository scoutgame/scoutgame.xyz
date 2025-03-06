import { log } from '@charmverse/core/log';
import sdk from '@farcaster/frame-sdk';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { setNotificationTokenAction } from '@packages/scoutgame/farcaster/setNotificationTokenAction';
import { loginWithWalletAction } from '@packages/scoutgame/session/loginWithWalletAction';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect } from 'react';

import { useUser } from '../providers/UserProvider';

import { useLoginSuccessHandler } from './useLoginSuccessHandler';
import { useTrackEvent } from './useTrackEvent';

export function useInitFarcasterData() {
  const router = useRouter();
  const { getNextPageLink } = useLoginSuccessHandler();
  const { refreshUser, user } = useUser();
  const { executeAsync: revalidatePath } = useAction(revalidatePathAction);
  const { executeAsync: setNotificationToken } = useAction(setNotificationTokenAction);
  const trackEvent = useTrackEvent();
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
      try {
        const context = await sdk.context;
        // If context is not present we are not inside a farcaster client
        if (!context) {
          return;
        }

        // Immediately signal that the frame is ready and hide the splash screen
        await sdk.actions.ready({});

        // If the user changes notification preferences in warpcast app keep them in sync with our db
        sdk.on('notificationsDisabled', async () => {
          await setNotificationToken({
            notificationToken: null
          });
        });

        sdk.on('notificationsEnabled', async ({ notificationDetails }) => {
          await setNotificationToken({
            notificationToken: notificationDetails.token
          });
        });

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
          const result = await sdk.actions.addFrame();
          if (result.notificationDetails) {
            await setNotificationToken({
              notificationToken: result.notificationDetails.token
            });
          }

          trackEvent('frame_added');
        } else {
          await setNotificationToken({
            notificationToken: context.client.notificationDetails?.token ?? null
          });
        }
      } catch (error) {
        log.error('Error initializing farcaster', { error });
      }
    };

    if (sdk) {
      load();
    }

    return () => {
      sdk.removeAllListeners();
    };
  }, [user, loginUser, setNotificationToken, trackEvent]);
}
