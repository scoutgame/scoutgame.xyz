import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Stack, Typography } from '@mui/material';
import Image from 'next/image';

export function ProfileCard({
  avatar,
  identity,
  displayName,
  points,
  nftsPurchased,
  onClick,
  isSelected,
  disabled
}: {
  avatar: string;
  identity: 'current' | 'farcaster' | 'telegram';
  displayName: string;
  points: number;
  nftsPurchased: number;
  onClick?: () => void;
  isSelected?: boolean;
  disabled?: boolean;
}) {
  return (
    <Stack
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        borderRadius: 2,
        px: 6,
        py: 4,
        backgroundColor: 'background.dark',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        outline: isSelected ? '1.5px solid' : '',
        outlineColor: disabled ? 'text.disabled' : isSelected ? 'primary.main' : 'transparent'
      }}
      onClick={disabled ? undefined : onClick}
    >
      {isSelected && (
        <CheckCircleIcon color={disabled ? 'disabled' : 'primary'} sx={{ position: 'absolute', top: 10, right: 10 }} />
      )}
      <Typography variant='h5' textTransform='capitalize'>
        {identity}
      </Typography>
      <Stack alignItems='center' gap={1}>
        <Image src={avatar} alt='avatar' width={150} height={150} />
        <Typography variant='body1'>{displayName}</Typography>
      </Stack>
      <Stack justifyContent='flex-start' gap={0.5}>
        <Typography variant='body1'>Points: {points} points</Typography>
        <Typography variant='body1'>Scouted: {nftsPurchased} Builders</Typography>
      </Stack>
    </Stack>
  );
}
