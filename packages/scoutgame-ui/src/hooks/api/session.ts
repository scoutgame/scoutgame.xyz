import type { SessionUser } from '@packages/nextjs/session/interfaces';
import type { WebAppInitData } from '@twa-dev/types';

import { useGETImmutable, useGETtrigger, usePOST } from '../helpers';

export function useGetUser() {
  return useGETImmutable<SessionUser | null>('/api/session/user');
}

export function useGetUserTrigger() {
  return useGETtrigger<undefined, SessionUser | null>('/api/session/user');
}

// persist the wallet address for this user or return an error if it belongs to someone else
export function useUserWalletAddress(address?: string) {
  return useGETImmutable(address ? `/api/session/wallet` : null, { address });
}

export function useGetClaimableTokens() {
  return useGETImmutable<{ tokens: number; processingPayouts: boolean }>(
    '/api/session/claimable-tokens',
    {},
    {
      refreshInterval: 30000
    }
  );
}

export function useInitTelegramUser() {
  return usePOST<{ initData: string }, WebAppInitData>('/api/session/telegram-user');
}
