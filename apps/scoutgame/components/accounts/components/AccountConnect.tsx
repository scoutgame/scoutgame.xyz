import CloseIcon from '@mui/icons-material/Close';
import { LoadingButton } from '@mui/lab';
import { Alert, Dialog, DialogTitle, Stack, Typography } from '@mui/material';

import type { UserAccountMetadata } from 'lib/users/getUserAccount';
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
  connectedUser: UserAccountMetadata;
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
      {connectedUser.builderStatus === null && user.builderStatus === null ? (
        <Stack direction='row' gap={2} justifyContent='space-between'>
          <ProfileCard
            onClick={() => setSelectedProfile('current')}
            avatar={user.avatar}
            identity='current'
            displayName={user.displayName}
            points={user.currentBalance}
            nftsPurchased={user.nftsPurchased}
            isSelected={selectedProfile === 'current'}
            disabled={isMergingUserAccount}
          />

          <ProfileCard
            onClick={() => setSelectedProfile('new')}
            avatar={connectedUser.avatar}
            identity={identity}
            displayName={connectedUser.displayName}
            points={connectedUser.currentBalance}
            nftsPurchased={connectedUser.nftsPurchased}
            isSelected={selectedProfile === 'new'}
            disabled={isMergingUserAccount}
          />
        </Stack>
      ) : isMergeDisabled ? (
        <Alert color='error' icon={<CloseIcon />}>
          Can not merge two builder accounts. Please select a different account to merge.
        </Alert>
      ) : (
        <Stack width='50%' margin='0 auto'>
          <ProfileCard
            avatar={connectedUser.avatar}
            identity={identity}
            displayName={connectedUser.displayName}
            points={connectedUser.currentBalance}
            nftsPurchased={connectedUser.nftsPurchased}
          />
        </Stack>
      )}

      <Stack alignItems='flex-end' m={3}>
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
    </Dialog>
  );
}
