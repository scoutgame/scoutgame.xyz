'use client';

import { Badge, Typography } from '@mui/material';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';

import { useGlobalModal } from 'components/common/ModalProvider';

export function DeveloperAvatar({
  developer,
  size
}: {
  developer: { path: string; avatar: string; displayName: string; gemsCollected?: number };
  size?: 'small';
}) {
  const { openModal } = useGlobalModal();

  return (
    <Badge
      onClick={() => openModal('developerInfo', { path: developer.path })}
      overlap='rectangular'
      sx={{ cursor: 'pointer' }}
      badgeContent={
        <Typography
          variant='caption'
          sx={{
            textShadow: '0px 1px 2px rgba(0, 0, 0, 1)',
            textAlign: 'right',
            letterSpacing: 0,
            fontWeight: 800,
            backgroundColor: '#5C4475',
            borderRadius: '2px',
            padding: '0 2px',
            lineHeight: '1.2em'
          }}
        >
          {developer.gemsCollected || 0}
        </Typography>
      }
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      slotProps={{
        badge: {
          style: {
            height: 18,
            paddingRight: 2,
            transform: 'none'
          }
        }
      }}
    >
      <Avatar
        src={developer.avatar}
        name={developer.displayName}
        variant='rounded'
        size='small'
        sx={{
          width: size === 'small' ? 30 : 36,
          height: size === 'small' ? 30 : 36,
          // borderRadius: '1px',
          // border: '1px solid var(--mui-palette-action-disabled)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />
    </Badge>
  );
}
