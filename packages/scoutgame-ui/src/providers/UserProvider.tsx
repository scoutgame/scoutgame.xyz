'use client';

import { log } from '@charmverse/core/log';
import type { SessionUser } from '@packages/nextjs/session/interfaces';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useEffect } from 'react';

import { useGetUser } from '../hooks/api/session';

type UserContext = {
  user: SessionUser | null;
  refreshUser: (_user?: SessionUser | null) => Promise<SessionUser | null | undefined>;
  isLoading: boolean;
};

export const UserContext = createContext<Readonly<UserContext | null>>(null);

const agreeToTermsPaths = ['/welcome', '/info'];

export function UserProvider({ children, userSession }: { children: ReactNode; userSession: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user = userSession, mutate: mutateUser, isLoading, isValidating } = useGetUser();
  const refreshUser = useCallback(
    async (_user?: SessionUser | null) => {
      return mutateUser(_user);
    },
    [mutateUser]
  );

  useEffect(() => {
    if (
      user &&
      (!user?.agreedToTermsAt || !user?.onboardedAt) &&
      !agreeToTermsPaths.some((path) => pathname.startsWith(path))
    ) {
      log.debug('Redirect user to agree to terms page', { pathname });
      router.push('/welcome');
    }
  }, [user, pathname]);

  const value = useMemo(
    () => ({ user, refreshUser, isLoading: isLoading || isValidating }),
    [user, refreshUser, isLoading, isValidating]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
}
