import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Stack } from '@mui/material';
import type { UserProfileData } from '@packages/scoutgame-ui/components/common/Profile/UserProfile';
import { UserProfile } from '@packages/scoutgame-ui/components/common/Profile/UserProfile';

export function ProfileCard({
  user,
  onClick,
  isSelected,
  disabled
}: {
  user: UserProfileData;
  onClick?: () => void;
  isSelected?: boolean;
  disabled?: boolean;
}) {
  return (
    <Stack
      sx={{
        borderRadius: 2,
        p: 1,
        backgroundColor: 'background.dark',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        outlineWidth: isSelected ? '1.5px' : '0px',
        outlineStyle: 'solid',
        outlineColor: disabled ? 'text.disabled' : isSelected ? 'primary.main' : 'transparent'
      }}
      onClick={disabled ? undefined : onClick}
    >
      {isSelected && (
        <CheckCircleIcon color={disabled ? 'disabled' : 'primary'} sx={{ position: 'absolute', top: 10, right: 10 }} />
      )}
      <UserProfile user={user} avatarSize='xLarge' hideShare />
    </Stack>
  );
}
