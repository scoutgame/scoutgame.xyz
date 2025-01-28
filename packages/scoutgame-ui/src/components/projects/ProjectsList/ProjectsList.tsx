import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Stack, Typography } from '@mui/material';
import type { UserScoutProjectInfo } from '@packages/scoutgame/projects/getUserScoutProjects';
import Image from 'next/image';
import Link from 'next/link';

export function ProjectsList({ projects }: { projects: UserScoutProjectInfo[] }) {
  return (
    <Stack gap={1}>
      {projects.length === 0 ? (
        <Typography>No projects created</Typography>
      ) : (
        projects.map((project) => (
          <Link href={`/projects/${project.path}`} key={project.id}>
            <Stack
              key={project.id}
              flexDirection='row'
              gap={1.5}
              alignItems='center'
              px={1.5}
              py={1}
              bgcolor='background.paper'
              justifyContent='space-between'
              borderRadius={1}
            >
              <Stack flexDirection='row' gap={1.5} alignItems='center'>
                <Image style={{ objectFit: 'cover' }} src={project.avatar} alt={project.name} width={32} height={32} />
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
