'use client';

import AddIcon from '@mui/icons-material/Add';
import { Button, Container, Stack, Typography } from '@mui/material';
import type { ScoutProjectDetailed } from '@packages/scoutgame/projects/getUserScoutProjects';
import { useState } from 'react';

import { useUser } from '../../providers/UserProvider';

import { CreateProjectForm } from './components/CreateProjectForm/CreateProjectForm';
import { ProjectsList } from './components/ProjectsList/ProjectsList';

export function ProjectsPage({ projects }: { projects: ScoutProjectDetailed[] }) {
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const { user } = useUser();

  return (
    <Container maxWidth='lg'>
      <Stack my={4} gap={2}>
        <Typography variant='h5' color='secondary'>
          {isCreatingProject ? 'Create a project' : 'Projects'}
        </Typography>
        {!isCreatingProject ? (
          <Stack gap={2}>
            <ProjectsList projects={projects} />
            <Button
              onClick={() => {
                setIsCreatingProject(true);
              }}
              startIcon={<AddIcon />}
              variant='outlined'
              color='secondary'
              sx={{ width: 'fit-content' }}
            >
              Create a project
            </Button>
          </Stack>
        ) : user ? (
          <CreateProjectForm onCancel={() => setIsCreatingProject(false)} user={user} />
        ) : null}
      </Stack>
    </Container>
  );
}
