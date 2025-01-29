import { Stack, Typography } from '@mui/material';
import type { ScoutProjectMinimal } from '@packages/scoutgame/projects/getUserScoutProjects';
import Image from 'next/image';
import Link from 'next/link';

export function ProjectsTab({ scoutProjects }: { scoutProjects: ScoutProjectMinimal[] }) {
  return (
    <Stack gap={1}>
      <Typography color='secondary'>Projects</Typography>
      <Stack
        flexDirection='row'
        rowGap={1}
        columnGap={1.5}
        flexWrap='wrap'
        bgcolor='background.paper'
        p={1.5}
        borderRadius={1}
      >
        {scoutProjects.map((project) => (
          <Link key={project.id} href={`/projects/${project.path}`}>
            <Stack flexDirection='row' gap={0.75} alignItems='center'>
              <Image
                src={project.avatar || 'https://www.svgrepo.com/show/335614/project.svg'}
                alt={project.name}
                width={20}
                height={20}
                style={{ objectFit: 'cover' }}
              />
              <Typography>{project.name}</Typography>
            </Stack>
          </Link>
        ))}
      </Stack>
    </Stack>
  );
}
