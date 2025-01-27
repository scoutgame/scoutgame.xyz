'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { Button, Stack, Typography } from '@mui/material';
import type { CreateScoutProjectFormValues } from '@packages/scoutgame/projects/createScoutProjectSchema';
import { useState } from 'react';
import { useFieldArray, type Control } from 'react-hook-form';

import { useUser } from '../../../providers/UserProvider';
import { Avatar } from '../../common/Avatar';

import { SearchProjectTeamMember } from './SearchProjectTeamMember';

const RoleTextRecord: Record<string, string> = {
  owner: 'Project Owner',
  member: 'Project Member'
};

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
        <Stack gap={2}>
          {teamMembers.map((member, index) => (
            <Stack
              key={member.scoutId}
              flexDirection='row'
              alignItems='center'
              justifyContent='space-between'
              bgcolor='background.paper'
              py={1}
              px={1.5}
            >
              <Stack flexDirection='row' alignItems='center' gap={1} flex={1}>
                <Avatar size='small' variant='circular' src={member.avatar} />
                <Typography>{member.displayName}</Typography>
                <Typography variant='caption' color='secondary'>
                  {RoleTextRecord[member.role]}
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
          startIcon={<AddIcon />}
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
