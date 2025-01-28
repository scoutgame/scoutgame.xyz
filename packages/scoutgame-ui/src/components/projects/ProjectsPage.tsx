'use client';

import AddIcon from '@mui/icons-material/Add';
import { Button, Container, Stack, Typography } from '@mui/material';
import type { UserScoutProject } from '@packages/scoutgame/projects/getUserScoutProjects';
import { useState } from 'react';

import { CreateProjectForm } from './CreateProject/CreateProjectForm';
import { ProjectsList } from './ProjectsList';

export function ProjectsPage({ projects }: { projects: UserScoutProject[] }) {
  const [isCreatingProject, setIsCreatingProject] = useState(false);

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
        ) : (
          <CreateProjectForm onCancel={() => setIsCreatingProject(false)} />
        )}
      </Stack>
    </Container>
  );
}
