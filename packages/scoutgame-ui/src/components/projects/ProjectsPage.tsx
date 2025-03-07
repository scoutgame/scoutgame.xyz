import AddIcon from '@mui/icons-material/Add';
import { Button, Container, Divider, Stack, Typography } from '@mui/material';
import type { ScoutProjectMinimal } from '@packages/scoutgame/projects/getUserScoutProjects';
import Link from 'next/link';

import { ProjectsList } from './components/ProjectsList';

export function ProjectsPage({ projects }: { projects: ScoutProjectMinimal[] }) {
  return (
    <Container maxWidth='md'>
      <Stack my={4} gap={2}>
        <Stack gap={1}>
          <Typography variant='h4' color='secondary' fontWeight={600}>
            Projects
          </Typography>
          <Typography>
            Projects are used by specific partner rewards, such as the Taiko AI Agents, to reward Developers for working
            on projects that have deployed smart contracts which are generating transactions.
          </Typography>
        </Stack>
        <Divider />
        <Stack gap={2}>
          <ProjectsList projects={projects} />
          <Button
            LinkComponent={Link}
            href='/profile/projects/create'
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
