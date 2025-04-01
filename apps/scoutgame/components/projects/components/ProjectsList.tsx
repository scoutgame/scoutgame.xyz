import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Stack, Typography } from '@mui/material';
import type { ScoutProjectMinimal } from '@packages/scoutgame/projects/getUserScoutProjects';
import Image from 'next/image';
import Link from 'next/link';

export function ProjectsList({ projects }: { projects: ScoutProjectMinimal[] }) {
  return (
    <Stack gap={1}>
      {projects.length === 0 ? (
        <Typography>No projects created</Typography>
      ) : (
        projects.map((project) => (
          <Link href={`/p/${project.path}`} key={project.id}>
            <Stack
              key={project.id}
              flexDirection='row'
              gap={1.5}
              alignItems='center'
              p={2}
              bgcolor='background.paper'
              justifyContent='space-between'
              borderRadius={1}
            >
              <Stack flexDirection='row' gap={1.5} alignItems='center'>
                <Image
                  style={{ objectFit: 'cover' }}
                  src={project.avatar || 'https://www.svgrepo.com/show/335614/project.svg'}
                  alt={project.name}
                  width={40}
                  height={40}
                />
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
