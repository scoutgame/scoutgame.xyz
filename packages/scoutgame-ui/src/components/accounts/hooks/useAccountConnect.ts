import { log } from '@charmverse/core/log';
import { revalidatePathAction } from '@packages/nextjs/actions/revalidatePathAction';
import { logoutAction } from '@packages/nextjs/session/logoutAction';
import type { ProfileToKeep } from '@packages/scoutgame/mergeUserAccount';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import type { UserProfile } from '@packages/users/getUserProfile';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useState } from 'react';

import type { UserWithAccountsDetails } from '../AccountsPage';

export type AccountIdentity = 'telegram' | 'wallet' | 'farcaster';

export function useAccountConnect<AuthData>({
  user,
  identity
}: {
  user: UserWithAccountsDetails;
  identity: AccountIdentity;
}) {
  const popupState = usePopupState({ variant: 'popover', popupId: `${identity}-connect` });
  const { refreshUser } = useUser();
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [connectedUser, setConnectedUser] = useState<UserProfile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileToKeep | null>(null);
  const [accountMergeError, setAccountMergeError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const router = useRouter();
  const { executeAsync: revalidatePath, isExecuting: isRevalidatingPath } = useAction(revalidatePathAction);
  const { executeAsync: logout, isExecuting: isLoggingOut } = useAction(logoutAction);

  const resetState = useCallback(() => {
    setAuthData(null);
    setConnectedUser(null);
    setAccountMergeError(null);
    setConnectionError(null);
    setSelectedProfile(null);
  }, []);

  const mergeAccountOnSuccess = useCallback(async () => {
    if ((connectedUser && connectedUser.builderStatus !== null) || selectedProfile === 'new') {
      await logout();
      router.push('/login');
    }
    await revalidatePath();
    await refreshUser();
    resetState();
  }, [revalidatePath, refreshUser, resetState, logout, connectedUser, selectedProfile, router]);

  const onCloseModal = useCallback(() => {
    resetState();
    popupState.close();
  }, [resetState, popupState]);

  const mergeAccountOnError = useCallback((err: any) => {
    log.error('Error merging user account', { error: err.error.serverError, identity, userId: user.id });
    setAccountMergeError(`Error merging ${identity} account`);
  }, []);

  const connectAccountOnSuccess = useCallback(async (_connectedUser: UserProfile | undefined) => {
    if (!_connectedUser) {
      await refreshUser();
      await revalidatePath();
    } else {
      setConnectedUser(_connectedUser);
      // If none of the accounts are builders, we want to preselect the current profile
      if (user.builderStatus === null && _connectedUser.builderStatus === null) {
        setSelectedProfile('current');
      } else {
        setSelectedProfile(null);
      }
    }

    popupState.close();
  }, []);

  const connectAccountOnError = useCallback((err: any) => {
    log.error('Error connecting account', { error: err.error.serverError, identity });
    setConnectionError(err.error.serverError?.message || 'Error connecting account');
    popupState.close();
  }, []);

  const isMergeDisabled = (connectedUser?.builderStatus !== null && user.builderStatus !== null) || isLoggingOut;

  return {
    isMergeDisabled,
    isRevalidatingPath,
    connectAccountOnSuccess,
    connectAccountOnError,
    mergeAccountOnSuccess,
    mergeAccountOnError,
    selectedProfile,
    accountMergeError,
    connectionError,
    setConnectionError,
    setAuthData,
    authData,
    connectedUser,
    setConnectedUser,
    setSelectedProfile,
    popupState,
    onCloseModal
  };
}
