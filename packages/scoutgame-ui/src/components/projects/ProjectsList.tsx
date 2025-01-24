import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Stack, Typography } from '@mui/material';
import type { UserScoutProject } from '@packages/scoutgame/projects/getUserScoutProjects';
import Link from 'next/link';

import { Avatar } from '../common/Avatar';

export function ProjectsList({ projects }: { projects: UserScoutProject[] }) {
  return (
    <Stack gap={2}>
      {projects.length === 0 ? (
        <Typography>No projects created</Typography>
      ) : (
        projects.map((project) => (
          <Link href={`/projects/${project.id}`} key={project.id}>
            <Stack
              key={project.id}
              flexDirection='row'
              gap={1.5}
              alignItems='center'
              px={1.5}
              py={1}
              bgcolor='background.paper'
              justifyContent='space-between'
            >
              <Stack flexDirection='row' gap={1.5} alignItems='center'>
                <Avatar src={project.avatar} size='small' variant='rounded' />
                <Typography variant='h6'>{project.name}</Typography>
              </Stack>
              <ChevronRightIcon />
            </Stack>
          </Link>
        ))
      )}
    </Stack>
  );
}
