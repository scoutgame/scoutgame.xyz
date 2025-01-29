'use client';

import { Container, Stack, Typography } from '@mui/material';
import type { SessionUser } from '@packages/nextjs/session/interfaces';

import { CreateProjectForm } from './components/CreateProjectForm';

export function CreateProjectPage({ user }: { user: SessionUser }) {
  return (
    <Container maxWidth='lg'>
      <Stack my={4} gap={1}>
        <Typography variant='h4' color='secondary' fontWeight={600}>
          Create a project
        </Typography>
        <Stack>
          <CreateProjectForm user={user} />
        </Stack>
      </Stack>
    </Container>
  );
}
