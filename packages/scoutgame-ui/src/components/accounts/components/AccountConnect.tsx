import CloseIcon from '@mui/icons-material/Close';
import { LoadingButton } from '@mui/lab';
import { Alert, Stack, Typography } from '@mui/material';
import type { ProfileToKeep } from '@packages/scoutgame/mergeUserAccount';
import type { UserProfile } from '@packages/users/getUserProfile';

import { Dialog } from '../../common/Dialog';
import type { UserWithAccountsDetails } from '../AccountsPage';
import type { AccountIdentity } from '../hooks/useAccountConnect';

import { ProfileCard } from './ProfileCard';

export function AccountConnect({
  user,
  identity,
  connectedUser,
  onClose,
  setSelectedProfile,
  selectedProfile,
  isMergingUserAccount,
  isMergeDisabled,
  accountMergeError,
  mergeUserAccount
}: {
  user: UserWithAccountsDetails;
  identity: AccountIdentity;
  connectedUser: UserProfile;
  onClose: () => void;
  setSelectedProfile: (profile: ProfileToKeep | null) => void;
  selectedProfile: ProfileToKeep | null;
  isMergingUserAccount: boolean;
  isMergeDisabled: boolean;
  accountMergeError: string | null;
  mergeUserAccount: () => void;
}) {
  return (
    <Dialog open={!!connectedUser} onClose={onClose} title={`This ${identity} account is connected to another account`}>
      <Typography sx={{ py: 1, pb: 2 }} variant='body1'>
        {connectedUser.builderStatus === null && user.builderStatus === null ? (
          <>
            Merge Profile by selecting which one to keep. Your Points and Developers will be transferred to the selected
            profile
          </>
        ) : (
          'Your Points and Developers will be transferred into your developer account'
        )}
      </Typography>
      {connectedUser.starterPackNftCount + user.starterPackNftCount > 3 ? (
        <Alert color='error' sx={{ mb: 2 }}>
          You have more than 3 starter cards across your accounts thus you can not merge your accounts.
        </Alert>
      ) : (
        <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {connectedUser.builderStatus === null && user.builderStatus === null ? (
            <Stack gap={2}>
              <ProfileCard
                onClick={() => setSelectedProfile('current')}
                user={user}
                isSelected={selectedProfile === 'current'}
                disabled={isMergingUserAccount}
              />

              <ProfileCard
                onClick={() => setSelectedProfile('new')}
                user={connectedUser}
                isSelected={selectedProfile === 'new'}
                disabled={isMergingUserAccount}
              />
            </Stack>
          ) : isMergeDisabled ? (
            <Alert color='error' icon={<CloseIcon />}>
              Can not merge two developer accounts. Please select a different account to merge.
            </Alert>
          ) : (
            <ProfileCard user={connectedUser} />
          )}

          <Stack alignItems='flex-end'>
            <LoadingButton
              variant='contained'
              loading={isMergingUserAccount}
              disabled={isMergingUserAccount || isMergeDisabled}
              onClick={mergeUserAccount}
            >
              {isMergingUserAccount
                ? 'Merging...'
                : connectedUser.builderStatus !== null || selectedProfile === 'new'
                  ? 'Merge and Logout'
                  : 'Merge'}
            </LoadingButton>
          </Stack>
          {accountMergeError && (
            <Typography variant='body2' textAlign='center' sx={{ mt: 2 }} color='error'>
              {accountMergeError}
            </Typography>
          )}
        </Stack>
      )}
    </Dialog>
  );
}
