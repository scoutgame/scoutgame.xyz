import { Box, Avatar, Stack, Typography } from '@mui/material';
import type { ScoutProjectMinimal } from '@packages/scoutgame/projects/getUserScoutProjects';
import Link from 'next/link';

export function ProjectsTab({ scoutProjects }: { scoutProjects: ScoutProjectMinimal[] }) {
  return (
    <Stack gap={1}>
      <Typography color='secondary'>Projects</Typography>
      <Stack flexDirection='row' rowGap={1} flexWrap='wrap' bgcolor='background.paper' py={2} borderRadius={1}>
        {scoutProjects.map((project) => (
          <Box
            key={project.id}
            href={`/p/${project.path}`}
            component={Link}
            sx={{ px: 2, minWidth: { xs: '50%', sm: '33%', md: '20%' } }}
          >
            <Stack flexDirection='row' gap={0.75} alignItems='center'>
              <Avatar
                src={project.avatar}
                alt={project.name}
                sx={{
                  width: 20,
                  height: 20,
                  fontSize: 14,
                  fontWeight: 600
                }}
                variant='square'
              />
              <Typography>{project.name}</Typography>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
