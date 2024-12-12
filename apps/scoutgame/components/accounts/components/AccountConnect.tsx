import CloseIcon from '@mui/icons-material/Close';
import { LoadingButton } from '@mui/lab';
import { Alert, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';

import type { UserProfile } from 'lib/users/getUserProfile';
import type { ProfileToKeep } from 'lib/users/mergeUserAccount';

import type { UserWithAccountsDetails } from '../AccountsPage';

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
  identity: 'telegram' | 'farcaster';
  connectedUser: UserProfile;
  onClose: () => void;
  setSelectedProfile: (profile: ProfileToKeep) => void;
  selectedProfile: ProfileToKeep;
  isMergingUserAccount: boolean;
  isMergeDisabled: boolean;
  accountMergeError: string | null;
  mergeUserAccount: () => void;
}) {
  return (
    <Dialog open={!!connectedUser} onClose={onClose}>
      <DialogTitle sx={{ pb: 0 }} align='center'>
        This {identity} account is connected to another account
      </DialogTitle>
      <DialogTitle sx={{ pt: 0.5 }} variant='body1' align='center'>
        {connectedUser.builderStatus === null && user.builderStatus === null ? (
          <>
            Merge Profile by selecting which one to keep.
            <br />
            Your Points and Scouted Builders will be merged into your current account
          </>
        ) : (
          'Your Points and Scouted Builders will be merged into your current account'
        )}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          <Alert color='error' icon={<CloseIcon />} sx={{ m: 3 }}>
            Can not merge two builder accounts. Please select a different account to merge.
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
            {isMergingUserAccount ? 'Merging...' : 'Merge'}
          </LoadingButton>
        </Stack>
        {accountMergeError && (
          <Typography variant='body2' textAlign='center' sx={{ mt: 2 }} color='error'>
            {accountMergeError}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
