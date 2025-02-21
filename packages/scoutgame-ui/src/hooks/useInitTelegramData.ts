import { log } from '@charmverse/core/log';
import { useInitTelegramUser } from '@packages/scoutgame-ui/hooks/api/session';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { getPlatform } from '@packages/utils/platform';
import WebApp from '@twa-dev/sdk';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useInitTelegramData() {
  const platform = getPlatform();
  const initData = typeof window !== 'undefined' && platform === 'telegram' ? WebApp.initData : null;
  const { trigger, isMutating } = useInitTelegramUser();
  const { refreshUser, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Load the Telegram Web App SDK
    if (typeof window !== 'undefined' && platform === 'telegram') {
      WebApp.ready();
    }
  }, []);

  useEffect(() => {
    if (initData) {
      trigger(
        { initData },
        {
          onSuccess: async (data) => {
            if (data) {
              await refreshUser();
              const param = data.start_param;
              if (param && param.startsWith('page_')) {
                const redirectUrl = param.replace('page_', '/').trim();
                router.push(redirectUrl);
              } else {
                router.push('/welcome');
              }
            }
          },
          onError: (error) => {
            log.error('Error loading telegram user', { error });
          }
        }
      );
    }
  }, [initData]);

  return { isLoading: isMutating || isLoading, initData };
}
