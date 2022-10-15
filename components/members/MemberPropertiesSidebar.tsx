import styled from '@emotion/styled';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, ClickAwayListener, Collapse, IconButton, InputLabel, MenuItem, Stack, TextField, Typography } from '@mui/material';
import type { MemberProperty, MemberPropertyType } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { SidebarHeader } from 'components/common/BoardEditor/focalboard/src/components/viewSidebar/viewSidebar';
import Button from 'components/common/Button';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import Modal from 'components/common/Modal';
import isAdmin from 'hooks/useIsAdmin';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { DefaultMemberPropertyDict, DEFAULT_MEMBER_PROPERTIES } from 'lib/members/constants';

import { AddMemberPropertyButton } from './AddMemberPropertyButton';
import { MemberPropertyItem } from './MemberPropertyItem';

const StyledSidebar = styled.div`
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-left: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
  display: flex;
  flex-direction: column;
  height: 300px;
  min-height: 100%;
  width: 100%;
  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 250px;
  }
`;

export function MemberPropertySidebarItem ({
  property
}: {
  property: MemberProperty;
}) {
  const [toggled, setToggled] = useState(false);
  const { properties = [], deleteProperty, updateProperty } = useMemberProperties();
  const [propertyName, setPropertyName] = useState('');
  const propertyRenamePopupState = usePopupState({ variant: 'popover', popupId: 'property-rename-modal' });
  const admin = isAdmin();
  const [selectedRoleIds, setSelectedRoleIds] = useState<string []>([]);

  const memberPropertySidebarItemPopupState = usePopupState({ variant: 'popover', popupId: 'member-property-sidebar-item' });

  return (
    <Stack>
      <MenuItem
        dense
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          '&:hover .icons': {
            opacity: 1
          },
          width: '100%',
          '& .MuiListItemIcon-root': {
            minWidth: 30
          },
          pl: 1
        }}
        onClick={() => setToggled(!toggled)}
      >
        <ArrowRightIcon
          onClick={() => setToggled(!toggled)}
          sx={{
            transform: toggled ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease-in-out'
          }}
        />
        <MemberPropertyItem
          type={property.type}
          name={property.name}
        />
        {admin && (
          <Box
            display='flex'
            gap={0.5}
            className='icons'
            sx={{
              opacity: 0
            }}
          >
            <EditIcon
              cursor='pointer'
              fontSize='small'
              color='secondary'
              onClick={(e) => {
                e.stopPropagation();
                propertyRenamePopupState.open();
                setPropertyName(property.name);
              }}
            />
            {!DEFAULT_MEMBER_PROPERTIES.includes(property.type as any) && (
              <DeleteIcon
                cursor='pointer'
                fontSize='small'
                color='secondary'
                onClick={(e) => {
                  e.stopPropagation();
                  deleteProperty(property.id);
                }}
              />
            )}
          </Box>
        )}
      </MenuItem>
      <Collapse in={toggled}>
        <Stack pl={5} pr={2.5} mb={1}>
          <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
            <Typography variant='subtitle2'>Workspace</Typography>
            <IconButton disabled={!admin} size='small' color='secondary'><VisibilityOutlinedIcon fontSize='small' /></IconButton>
          </Stack>
          <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
            <Typography variant='subtitle2'>Admins</Typography>
            <IconButton disabled={!admin} size='small' color='secondary'><VisibilityOutlinedIcon fontSize='small' /></IconButton>
          </Stack>
          <Button
            variant='text'
            size='small'
            color='secondary'
            sx={{
              width: 'fit-content'
            }}
            startIcon={<AddOutlinedIcon />}
            onClick={memberPropertySidebarItemPopupState.open}
            disabled={!admin}
          >
            Add Role
          </Button>
        </Stack>
      </Collapse>
      <Modal size='large' open={propertyRenamePopupState.isOpen} onClose={propertyRenamePopupState.close} title='Rename property'>
        <Box>
          <TextField
            error={!propertyName}
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            autoFocus
          />
          <Button
            disabled={!propertyName}
            onClick={async () => {
              if (propertyName) {
                await updateProperty({
                  index: properties.length,
                  name: propertyName,
                  id: property.id
                });
                setPropertyName('');
                propertyRenamePopupState.close();
              }
            }}
          >Rename
          </Button>
        </Box>
      </Modal>

      <Modal size='large' open={memberPropertySidebarItemPopupState.isOpen} onClose={memberPropertySidebarItemPopupState.close} title='Add roles'>
        <Stack gap={0.5}>
          <InputLabel>Roles</InputLabel>
          <InputSearchRoleMultiple
            onChange={setSelectedRoleIds}
            filter={{
              mode: 'exclude',
              // TODO: It should be fetched from backend
              userIds: []
            }}
          />
          <Button sx={{
            mt: 1,
            width: 'fit-content'
          }}
          >Add
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}

export function MemberPropertiesSidebar ({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const propertyNamePopupState = usePopupState({ variant: 'popover', popupId: 'property-name-modal' });
  const [selectedPropertyType, setSelectedPropertyType] = useState<null | MemberPropertyType>(null);

  const { properties, addProperty } = useMemberProperties();

  const [propertyName, setPropertyName] = useState('');

  return properties ? (
    <>
      <ClickAwayListener mouseEvent='onClick' onClickAway={onClose}>
        <Collapse in={isOpen} orientation='horizontal' sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 1000 }}>
          <StyledSidebar>
            <SidebarHeader
              closeSidebar={onClose}
              title='Properties'
            />
            <Stack mb={1}>
              {properties.map(property => <MemberPropertySidebarItem property={property} key={property.id} />)}
            </Stack>
            <AddMemberPropertyButton
              onClick={(memberPropertyType) => {
                setSelectedPropertyType(memberPropertyType as MemberPropertyType);
                setPropertyName(DefaultMemberPropertyDict[memberPropertyType]);
                propertyNamePopupState.open();
              }}
            />
          </StyledSidebar>
        </Collapse>
      </ClickAwayListener>
      <Modal size='large' open={propertyNamePopupState.isOpen} onClose={propertyNamePopupState.close} title='Name your property'>
        <Box>
          <TextField
            error={!propertyName || !selectedPropertyType}
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            autoFocus
          />
          <Button
            disabled={!propertyName || !selectedPropertyType}
            sx={{
              height: 40
            }}
            onClick={async () => {
              if (propertyName && selectedPropertyType) {
                await addProperty({
                  index: properties.length,
                  name: propertyName,
                  options: null,
                  type: selectedPropertyType
                });
                setPropertyName('');
                propertyNamePopupState.close();
              }
            }}
          >Add
          </Button>
        </Box>
      </Modal>
    </>
  ) : null;
}
