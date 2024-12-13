import { log } from '@charmverse/core/log';
import { revalidatePathAction } from '@packages/scoutgame/actions/revalidatePathAction';
import type { UserProfile } from '@packages/scoutgame/users/getUserProfile';
import type { ProfileToKeep } from '@packages/scoutgame/users/mergeUserAccount';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useState } from 'react';

import type { UserWithAccountsDetails } from '../AccountsPage';

export function useAccountConnect<AuthData>({ user, identity }: { user: UserWithAccountsDetails; identity: string }) {
  const popupState = usePopupState({ variant: 'popover', popupId: `${identity}-connect` });
  const { refreshUser } = useUser();

  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [connectedUser, setConnectedUser] = useState<UserProfile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileToKeep>('current');
  const [accountMergeError, setAccountMergeError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { executeAsync: revalidatePath, isExecuting: isRevalidatingPath } = useAction(revalidatePathAction);
  const mergeAccountOnSuccess = useCallback(async () => {
    setAuthData(null);
    setConnectedUser(null);
    setAccountMergeError(null);
    await revalidatePath();
    await refreshUser();
  }, [revalidatePath, refreshUser]);

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
      // If the current user is a builder, we want to keep the current profile
      if (user.builderStatus !== null) {
        setSelectedProfile('current');
      } else {
        setSelectedProfile('new');
      }
    }

    popupState.close();
  }, []);

  const connectAccountOnError = useCallback((err: any) => {
    log.error('Error connecting account', { error: err.error.serverError, identity });
    setConnectionError('Error connecting account');
    popupState.close();
  }, []);

  const isMergeDisabled = connectedUser?.builderStatus !== null && user.builderStatus !== null;

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
    popupState
  };
}
