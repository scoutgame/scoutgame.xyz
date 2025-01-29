'use client';

import type { ScoutProjectMemberRole } from '@charmverse/core/prisma-client';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { Button, Stack, Typography } from '@mui/material';
import type { CreateScoutProjectFormValues } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { useState } from 'react';
import { useFieldArray, type Control } from 'react-hook-form';

import { useUser } from '../../../../providers/UserProvider';
import { Avatar } from '../../../common/Avatar';
import { ProjectRoleText } from '../../constants';

import { SearchProjectTeamMember } from './SearchProjectTeamMember';

export function ProjectTeamMemberForm({ control }: { control: Control<CreateScoutProjectFormValues> }) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const {
    append,
    remove,
    fields: teamMembers
  } = useFieldArray({
    name: 'teamMembers',
    control
  });

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
              <Stack flexDirection='row' alignItems='center' gap={1} flex={1}>
                <Avatar size='small' variant='circular' src={member.avatar} />
                <Typography>{member.displayName}</Typography>
                <Typography variant='caption' color='secondary'>
                  {ProjectRoleText[member.role as ScoutProjectMemberRole]}
                </Typography>
              </Stack>
              {member.scoutId !== user?.id && (
                <DeleteIcon
                  color='error'
                  fontSize='small'
                  onClick={() => remove(index)}
                  sx={{
                    cursor: 'pointer'
                  }}
                />
              )}
            </Stack>
          ))}
        </Stack>
        <Button
          variant='outlined'
          color='secondary'
          sx={{ width: 'fit-content' }}
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setOpen(true)}
        >
          Team Member
        </Button>
      </Stack>
      <SearchProjectTeamMember
        open={open}
        setOpen={setOpen}
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
          setOpen(false);
        }}
      />
    </>
  );
}
