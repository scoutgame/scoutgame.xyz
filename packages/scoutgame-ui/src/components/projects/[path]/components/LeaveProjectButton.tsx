'use client';

import { Button, Stack, Typography } from '@mui/material';
import type { ScoutProjectDetailed } from '@packages/scoutgame/projects/getProjectByPath';
import { leaveProjectAction } from '@packages/scoutgame/projects/leaveProjectAction';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';

import { Dialog } from '../../../../components/common/Dialog';
import { useUser } from '../../../../providers/UserProvider';

export function LeaveProjectButton({ project }: { project: ScoutProjectDetailed }) {
  const { user } = useUser();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { execute: leaveProject, isExecuting } = useAction(leaveProjectAction);

  if (!user) {
    return null;
  }
  const teamMember = project.teamMembers.find((member) => member.id === user.id);
  if (!teamMember || teamMember.role === 'owner') {
    return null;
  }
  return (
    <>
      <Button
        sx={{ width: 'fit-content' }}
        variant='outlined'
        color='error'
        onClick={() => setIsConfirmModalOpen(true)}
        disabled={isExecuting}
      >
        Leave Project
      </Button>
      <Dialog title='Leave Project' open={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
        <Typography>Are you sure you want to leave this project?</Typography>
        <Stack flexDirection='row' alignItems='center' gap={1} mt={2}>
          <Button color='primary' variant='outlined' onClick={() => setIsConfirmModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              leaveProject({ projectId: project.id });
              setIsConfirmModalOpen(false);
            }}
            color='error'
          >
            Leave
          </Button>
        </Stack>
      </Dialog>
    </>
  );
}
