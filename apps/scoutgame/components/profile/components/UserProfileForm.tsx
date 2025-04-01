'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { DEFAULT_BIO } from '@packages/scoutgame-ui/components/common/Profile/EditableUserProfile/EditableBio';
import { EditableUserProfile } from '@packages/scoutgame-ui/components/common/Profile/EditableUserProfile/EditableUserProfile';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import { updateUserDetailsAction } from '@packages/users/updateUserDetailsAction';
import type { UpdateUserDetailsFormValues } from '@packages/users/updateUserDetailsSchema';
import { updateUserDetailsSchema } from '@packages/users/updateUserDetailsSchema';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import type { UserWithProfiles } from '../ProfilePage';

export function UserProfileForm({ user }: { user: UserWithProfiles }) {
  const isDesktop = useMdScreen();
  const { control, getValues } = useForm<UpdateUserDetailsFormValues>({
    resolver: yupResolver(updateUserDetailsSchema),
    mode: 'onChange',
    defaultValues: {
      avatar: user.avatar ?? undefined,
      displayName: user.displayName,
      bio: user.bio ?? DEFAULT_BIO
    }
  });
  const { refreshUser } = useUser();

  const { execute: updateUserDetails, isExecuting: isUpdatingUserDetails } = useAction(updateUserDetailsAction, {
    onSuccess: ({ data }) => {
      if (data) {
        refreshUser(data);
      }
    }
  });

  const values = getValues();

  return (
    <EditableUserProfile
      user={user}
      control={control}
      onAvatarChange={(url) => {
        updateUserDetails({ avatar: url, displayName: values.displayName });
      }}
      onDisplayNameChange={(displayName) => {
        updateUserDetails({ avatar: values.avatar, displayName });
      }}
      onBioChange={(bio) => {
        updateUserDetails({ avatar: values.avatar, displayName: values.displayName, bio });
      }}
      isLoading={isUpdatingUserDetails}
      avatarSize={isDesktop ? 100 : 75}
    />
  );
}
