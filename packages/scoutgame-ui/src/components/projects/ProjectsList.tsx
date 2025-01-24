import { Avatar, Stack, Typography } from '@mui/material';
import type { UserScoutProject } from '@packages/scoutgame/projects/getUserScoutProjects';
import Link from 'next/link';

export function ProjectsList({ projects }: { projects: UserScoutProject[] }) {
  return (
    <Stack gap={2}>
      {projects.length === 0 ? (
        <Typography>No projects created</Typography>
      ) : (
        projects.map((project) => (
          <Link href={`/projects/${project.id}`} key={project.id}>
            <Stack key={project.id} flexDirection='row' gap={2}>
              <Avatar src={project.avatar} />
              <Typography variant='h6'>{project.name}</Typography>
            </Stack>
          </Link>
        ))
      )}
    </Stack>
  );
}
