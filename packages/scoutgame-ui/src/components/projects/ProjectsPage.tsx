import AddIcon from '@mui/icons-material/Add';
import { Button, Container, Stack, Typography } from '@mui/material';
import type { ScoutProjectDetailed } from '@packages/scoutgame/projects/getUserScoutProjects';
import Link from 'next/link';

import { ProjectsList } from './components/ProjectsList';

export function ProjectsPage({ projects }: { projects: ScoutProjectDetailed[] }) {
  return (
    <Container maxWidth='lg'>
      <Stack my={4} gap={2}>
        <Typography variant='h4' color='secondary' fontWeight={600}>
          Projects
        </Typography>
        <Stack gap={2}>
          <ProjectsList projects={projects} />
          <Button
            LinkComponent={Link}
            href='/create-project'
            startIcon={<AddIcon />}
            variant='outlined'
            color='secondary'
            sx={{ width: 'fit-content' }}
          >
            Create a project
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
