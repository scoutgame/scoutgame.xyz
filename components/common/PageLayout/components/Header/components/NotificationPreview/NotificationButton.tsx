import NotificationsIcon from '@mui/icons-material/Notifications';
import { IconButton } from '@mui/material';
import Popover from '@mui/material/Popover';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';

import { useMdScreen } from 'hooks/useMediaScreens';

import NotificationsBadge from '../../../Sidebar/NotificationsBadge';

import { NotificationPreviewPopover } from './NotificationPreviewPopover';

export function NotificationButton({ onSeeAllClick }: { onSeeAllClick: () => void }) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });
  const isMdScreen = useMdScreen();
  const handleSeeAllClick = () => {
    onSeeAllClick();
    popupState.close();
  };
  return (
    <>
      <NotificationsBadge onClick={popupState.open} sx={{ cursor: 'pointer' }}>
        <IconButton size={isMdScreen ? 'small' : 'medium'}>
          <NotificationsIcon fontSize='small' color='secondary' />
        </IconButton>
      </NotificationsBadge>
      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        PaperProps={{
          sx: {
            width: 375
          }
        }}
      >
        <NotificationPreviewPopover onSeeAllClick={handleSeeAllClick} close={popupState.close} />
      </Popover>
    </>
  );
}
