'use client';

import AddIcon from '@mui/icons-material/Add';
import { Button, Stack } from '@mui/material';
import type { UserScoutProject } from '@packages/scoutgame/projects/getUserScoutProjects';
import { useState } from 'react';

import { ProjectsList } from '../ProjectsList';

import { CreateProjectForm } from './CreateProjectForm';

export function CreateProjectButton({ projects }: { projects: UserScoutProject[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return !isOpen ? (
    <Stack gap={2}>
      <ProjectsList projects={projects} />
      <Button
        onClick={() => {
          setIsOpen(true);
        }}
        startIcon={<AddIcon />}
        variant='outlined'
        color='secondary'
        sx={{ width: 'fit-content' }}
      >
        Create a project
      </Button>
    </Stack>
  ) : (
    <CreateProjectForm onCancel={() => setIsOpen(false)} />
  );
}
