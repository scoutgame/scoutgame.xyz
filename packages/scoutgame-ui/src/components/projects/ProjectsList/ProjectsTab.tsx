import { Stack, Typography } from '@mui/material';
import type { UserScoutProjectInfo } from '@packages/scoutgame/projects/getUserScoutProjects';
import Image from 'next/image';

export function ProjectsTab({ scoutProjects }: { scoutProjects: UserScoutProjectInfo[] }) {
  return (
    <Stack gap={1}>
      <Typography variant='h6' color='text.secondary'>
        Projects
      </Typography>
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
          <Stack key={project.id} flexDirection='row' gap={0.75} alignItems='center'>
            <Image src={project.avatar} alt={project.name} width={20} height={20} style={{ objectFit: 'cover' }} />
            <Typography>{project.name}</Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
