'use client';

import type { ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Button, MenuItem, Menu, Stack, Typography, IconButton } from '@mui/material';
import type { CreateScoutProjectFormValues } from '@packages/scoutgame/projects/createScoutProjectSchema';
import React, { useCallback, useState } from 'react';
import { useFieldArray, type Control } from 'react-hook-form';

import { useUser } from '../../../../providers/UserProvider';
import { Avatar } from '../../../common/Avatar';
import { Dialog } from '../../../common/Dialog';
import { ProjectRoleText } from '../../../projects/constants';

import { SearchProjectTeamMember } from './SearchProjectTeamMember';

export function ProjectTeamMemberForm({
  control,
  showRemoveMemberConfirmation
}: {
  control: Control<CreateScoutProjectFormValues>;
  showRemoveMemberConfirmation: boolean;
}) {
  const { user } = useUser();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMemberMenuOpen = Boolean(anchorEl);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const {
    append,
    remove,
    fields: teamMembers,
    update
  } = useFieldArray({
    name: 'teamMembers',
    control
  });

  const handleMakeOwner = useCallback(
    (index: number) => {
      const currentOwnerIndex = teamMembers.findIndex((member) => member.role === 'owner');
      const currentOwner = currentOwnerIndex !== -1 ? teamMembers[currentOwnerIndex] : null;
      if (currentOwner) {
        update(currentOwnerIndex, {
          role: 'member',
          displayName: currentOwner.displayName,
          scoutId: currentOwner.scoutId,
          avatar: currentOwner.avatar
        });
      }
      update(index, {
        role: 'owner',
        displayName: teamMembers[index].displayName,
        scoutId: teamMembers[index].scoutId,
        avatar: teamMembers[index].avatar
      });
    },
    [update, teamMembers]
  );

  const handleRemoveMember = useCallback(
    (index: number) => {
      if (showRemoveMemberConfirmation) {
        setSelectedMemberIndex(index);
        setIsConfirmModalOpen(true);
      } else {
        remove(index);
      }
    },
    [remove, showRemoveMemberConfirmation, setSelectedMemberIndex, setIsConfirmModalOpen]
  );

  return (
    <>
      <Stack gap={2}>
        <Stack gap={1}>
          {teamMembers.map((member, index) => (
            <Stack
              key={member.scoutId}
              flexDirection='row'
              alignItems='center'
              justifyContent='space-between'
              bgcolor='background.paper'
              py={1}
              px={1.5}
              borderRadius={1}
            >
              <Stack flexDirection='row' alignItems='center' gap={2} flex={1}>
                <Avatar size='large' variant='circular' src={member.avatar} />
                <Typography>{member.displayName}</Typography>
                <Typography variant='caption' color='secondary'>
                  {ProjectRoleText[member.role as ScoutProjectMemberRole]}
                </Typography>
              </Stack>
              {member.scoutId !== user?.id && (
                <Stack>
                  <IconButton size='small' onClick={(e) => setAnchorEl(e.currentTarget as unknown as HTMLElement)}>
                    <MoreHorizIcon />
                  </IconButton>
                  <Menu anchorEl={anchorEl} open={isMemberMenuOpen} onClose={handleClose}>
                    <MenuItem
                      onClick={() => {
                        handleMakeOwner(index);
                        handleClose();
                      }}
                    >
                      Make owner
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleRemoveMember(index);
                        handleClose();
                      }}
                    >
                      Remove
                    </MenuItem>
                  </Menu>
                </Stack>
              )}
            </Stack>
          ))}
        </Stack>
        <Button
          variant='outlined'
          color='secondary'
          sx={{ width: 'fit-content' }}
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setIsDialogOpen(true)}
        >
          Add a member
        </Button>
      </Stack>
      <SearchProjectTeamMember
        open={isDialogOpen}
        setOpen={setIsDialogOpen}
        filteredMemberIds={teamMembers.map((member) => member.scoutId)}
        onProjectMembersAdd={(membersInfo) => {
          membersInfo.forEach((memberInfo) => {
            append({
              scoutId: memberInfo.scoutId,
              avatar: memberInfo.avatar,
              role: memberInfo.role,
              displayName: memberInfo.displayName
            });
          });
          setIsDialogOpen(false);
        }}
      />
      <Dialog title='Remove Member' open={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
        <Typography>Are you sure you want to remove this member from the project?</Typography>
        <Stack flexDirection='row' alignItems='center' gap={1} mt={2}>
          <Button color='primary' variant='outlined' onClick={() => setIsConfirmModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedMemberIndex !== null) {
                remove(selectedMemberIndex);
              }
              setIsConfirmModalOpen(false);
            }}
            color='error'
          >
            Remove
          </Button>
        </Stack>
      </Dialog>
    </>
  );
}
