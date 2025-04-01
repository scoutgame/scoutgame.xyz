import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getUserScoutProjectsInfo } from '@packages/scoutgame/projects/getUserScoutProjects';

import { ProjectsPage } from 'components/projects/ProjectsPage';

export default async function ProjectsPageContainer() {
  const session = await getSession();
  const scoutId = session.scoutId;

  if (!scoutId) {
    return null;
  }

  const allPromises = [getUserScoutProjectsInfo({ userId: scoutId })] as const;

  const [error, data] = await safeAwaitSSRData(Promise.all(allPromises));

  if (error) {
    return null;
  }

  const [projects] = data;

  return <ProjectsPage projects={projects} />;
}
