import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import NavigateNextIcon from '@mui/icons-material/ArrowRightAlt';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import NextLink from 'next/link';
import { useCallback, useState } from 'react';

import CreateWorkspaceForm from 'components/common/CreateSpaceForm';
import { Modal } from 'components/common/Modal';
import UserDisplay from 'components/common/UserDisplay';
import { useUserDetails } from 'components/profile/components/UserDetails/hooks/useUserDetails';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';

import { headerHeight } from '../Header';

import SpaceListItem from './SpaceListItem';
import WorkspaceAvatar from './WorkspaceAvatar';

const StyledButton = styled(Button)(
  ({ theme }) => `
  justify-content: flex-start;
  padding: ${theme.spacing(0.3, 5, 0.3, 2)};
  '&:hover': { 
    backgroundColor: ${theme.palette.action.hover};
  }
  ${theme.breakpoints.up('lg')} {
    padding-right: ${theme.spacing(2)};
  }
`
);

const SidebarHeader = styled(Box)(
  ({ theme }) => `
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: ${headerHeight}px;
  .MuiIconButton-root, .MuiButton-root {
    transition: ${theme.transitions.create('all', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })}
  }
  & .MuiIconButton-root {
    border-radius: 4px;
  }`
);

export default function SidebarSubmenu({
  closeSidebar,
  logoutCurrentUser
}: {
  closeSidebar: () => void;
  logoutCurrentUser: () => void;
}) {
  const currentSpace = useCurrentSpace();
  const { spaces, createNewSpace, isCreatingSpace } = useSpaces();
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);
  const { user, setUser } = useUser();
  const { handleUserUpdate, isSaving } = useUserDetails({
    updateUser: setUser,
    user: user!
  });

  function showSpaceForm() {
    setSpaceFormOpen(true);
  }

  function closeSpaceForm() {
    setSpaceFormOpen(false);
  }

  const menuPopupState = usePopupState({ variant: 'popover', popupId: 'profile-dropdown' });

  const sortOrder =
    user?.spacesOrder && user.spacesOrder.length === spaces.length ? user.spacesOrder : spaces.map((s) => s.id);

  const changeOrderHandler = useCallback(
    async (draggedProperty: string, droppedOnProperty: string) => {
      const newOrder = [...sortOrder];
      const propIndex = newOrder.indexOf(draggedProperty); // find the property that was dragged
      newOrder.splice(propIndex, 1); // remove the dragged property from the array
      const droppedOnIndex = newOrder.indexOf(droppedOnProperty); // find the index of the space that was dropped on
      newOrder.splice(droppedOnIndex, 0, draggedProperty); // add the property to the new index
      await handleUserUpdate({ spacesOrder: newOrder });
    },
    [sortOrder, handleUserUpdate]
  );

  const sortedSpaces = [...spaces].sort((a, b) => sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id));

  return (
    <SidebarHeader className='sidebar-header' position='relative'>
      <StyledButton
        data-test='sidebar-space-menu'
        endIcon={<KeyboardArrowDownIcon fontSize='small' />}
        variant='text'
        color='inherit'
        fullWidth
        {...bindTrigger(menuPopupState)}
      >
        <WorkspaceAvatar name={currentSpace?.name ?? ''} image={currentSpace?.spaceImage ?? null} />
        <Typography variant='body1' data-test='sidebar-space-name' noWrap ml={1}>
          {currentSpace?.name}
        </Typography>
      </StyledButton>
      <Menu onClick={menuPopupState.close} {...bindMenu(menuPopupState)}>
        <MenuItem component={NextLink} href='/nexus'>
          <Box display='flex' flexDirection='row'>
            <Box>
              <UserDisplay user={user} hideName />
            </Box>
            <Box ml={1}>
              <Typography variant='body2'>{user?.username}</Typography>
              <Typography variant='body2' color='secondary'>
                My Profile
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        <Divider />
        <Typography component='p' variant='caption' mx={2} mb={0.5}>
          My Spaces
        </Typography>
        {sortedSpaces.map((_space) => (
          <SpaceListItem
            key={_space.id}
            disabled={isSaving}
            selected={currentSpace?.domain === _space.domain}
            space={_space}
            changeOrderHandler={changeOrderHandler}
          />
        ))}
        <MenuItem onClick={showSpaceForm} data-test='spaces-menu-add-new-space'>
          <AddIcon sx={{ m: '5px 15px 5px 8px' }} />
          Create or join a space
        </MenuItem>
        <Divider />
        <MenuItem onClick={logoutCurrentUser}>Sign out</MenuItem>
      </Menu>
      <Tooltip title='Close sidebar' placement='bottom'>
        <IconButton onClick={closeSidebar} size='small' sx={{ position: 'absolute', right: 0, top: 12 }}>
          <MenuOpenIcon />
        </IconButton>
      </Tooltip>
      <Modal open={spaceFormOpen} onClose={closeSpaceForm}>
        <CreateWorkspaceForm onSubmit={createNewSpace} onCancel={closeSpaceForm} isSubmitting={isCreatingSpace} />
        <Typography variant='body2' align='center' sx={{ pt: 2 }}>
          <Button variant='text' href='/join' endIcon={<NavigateNextIcon />}>
            Join an existing space
          </Button>
        </Typography>
      </Modal>
    </SidebarHeader>
  );
}
