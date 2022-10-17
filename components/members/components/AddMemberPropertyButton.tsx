import AddIcon from '@mui/icons-material/Add';
import { Button, Menu, MenuItem, Stack, TextField } from '@mui/material';
import type { MemberPropertyType } from '@prisma/client';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import Modal from 'components/common/Modal';
import isAdmin from 'hooks/useIsAdmin';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';
import { DEFAULT_MEMBER_PROPERTIES, DefaultMemberPropertyDict } from 'lib/members/constants';

import { MemberPropertyItem } from './MemberPropertyItem';

export function AddMemberPropertyButton () {
  const addMemberPropertyPopupState = usePopupState({ variant: 'popover', popupId: 'member-property' });
  const admin = isAdmin();
  const { mutateMembers } = useMembers();
  const propertyNamePopupState = usePopupState({ variant: 'popover', popupId: 'property-name-modal' });
  const [selectedPropertyType, setSelectedPropertyType] = useState<null | MemberPropertyType>(null);
  const [propertyName, setPropertyName] = useState('');
  const { properties, addProperty } = useMemberProperties();

  return (
    <>
      <Button
        variant='text'
        size='small'
        color='secondary'
        startIcon={<AddIcon />}
        sx={{
          p: 1
        }}
        disabled={!admin}
        onClick={addMemberPropertyPopupState.open}
      >
        Add Property
      </Button>
      <Menu
        {...bindMenu(addMemberPropertyPopupState)}
        sx={{
          width: '100%',
          '& .MuiListItemIcon-root': {
            minWidth: 30
          }
        }}
      >
        {Object.keys(DefaultMemberPropertyDict).map((memberPropertyType) => (
          !DEFAULT_MEMBER_PROPERTIES.includes(memberPropertyType as any) && (
            <MenuItem
              key={memberPropertyType}
              onClick={() => {
                setSelectedPropertyType(memberPropertyType as MemberPropertyType);
                propertyNamePopupState.open();
                addMemberPropertyPopupState.close();
              }}
            >
              <MemberPropertyItem
                type={memberPropertyType as MemberPropertyType}
              />
            </MenuItem>
          )
        ))}
      </Menu>
      <Modal size='large' open={propertyNamePopupState.isOpen} onClose={propertyNamePopupState.close} title='Name your property'>
        <Stack gap={1} flexDirection='row'>
          <TextField
            fullWidth
            error={!propertyName || !selectedPropertyType}
            value={propertyName}
            placeholder='Name'
            onChange={(e) => setPropertyName(e.target.value)}
            autoFocus
            sx={{
              flexGrow: 1
            }}
          />
          <Button
            disabled={!propertyName || !selectedPropertyType}
            sx={{
              width: 'fit-content'
            }}
            onClick={async () => {
              if (propertyName && selectedPropertyType) {
                await addProperty({
                  index: properties?.length ?? 0,
                  name: propertyName,
                  options: null,
                  type: selectedPropertyType
                });
                setPropertyName('');
                mutateMembers();
                propertyNamePopupState.close();
              }
            }}
          >Add
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
