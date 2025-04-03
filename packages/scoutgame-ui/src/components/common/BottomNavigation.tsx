import { BottomNavigation, styled } from '@mui/material';

import { brandColor } from '../../theme/colors';

export const StyledBottomNavigation = styled(BottomNavigation, {
  shouldForwardProp: (prop) => prop !== 'topNav' && prop !== 'largerNavbar'
})<{ topNav?: boolean; largerNavbar?: boolean }>(({ theme, topNav, largerNavbar }) => ({
  background: topNav
    ? 'transparent'
    : `linear-gradient(88.35deg, #96CDFF 0%, ${brandColor} 29.5%, #96CDFF 75.47%, ${brandColor} 100%)`,
  height: largerNavbar ? '71px' : undefined,
  '& > a': {
    color: topNav ? theme.palette.text.primary : theme.palette.common.black,
    gap: '2px',
    width: topNav ? '110px' : 'auto',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)'
    },
    '&.Mui-selected': {
      color: theme.palette.text.primary,
      backgroundColor: topNav ? theme.palette.primary.main : 'rgba(44, 0, 90, 0.25)'
    },
    '&.MuiButtonBase-root': {
      paddingBottom: largerNavbar ? '15px' : undefined,
      minWidth: '60px'
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '.75rem'
    }
  }
}));
