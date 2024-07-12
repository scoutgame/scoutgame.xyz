import 'server-only';

import { Typography } from '@mui/material';

import { getRecentProjectsWithMembers } from 'lib/projects/getRecentProjectsWithMembers';

import { ProjectItem } from './ProjectItem';

export async function ProjectsList({ userId }: { userId?: string }) {
  const projectsList = await getRecentProjectsWithMembers({
    userId
  });

  if (projectsList.length === 0) {
    return <Typography>There are no new projects</Typography>;
  }

  return projectsList.map((project) => {
    return <ProjectItem key={project.id} project={project} />;
  });
}