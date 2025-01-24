import { Container, Stack, Typography } from '@mui/material';
import type { UserScoutProject } from '@packages/scoutgame/projects/getUserScoutProjects';

import { CreateProjectButton } from './CreateProject/CreateProjectButton';

export function ProjectsPage({ projects }: { projects: UserScoutProject[] }) {
  return (
    <Container maxWidth='lg'>
      <Stack my={2} gap={4}>
        <Typography variant='h5' color='secondary'>
          Projects
        </Typography>
        <CreateProjectButton projects={projects} />
      </Stack>
    </Container>
  );
}
