import { Container, Stack, Typography } from '@mui/material';
import type { ScoutProjectDetailed } from '@packages/scoutgame/projects/getUserScoutProjects';

import { EditProjectForm } from './components/EditProjectForm';

export function EditProjectPage({ project }: { project: ScoutProjectDetailed }) {
  return (
    <Container maxWidth='lg'>
      <Stack my={4} gap={2}>
        <Typography variant='h4' color='secondary' fontWeight={600}>
          Edit project
        </Typography>
        <EditProjectForm project={project} />
      </Stack>
    </Container>
  );
}
