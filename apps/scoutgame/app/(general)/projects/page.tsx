import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getUserScoutProjects } from '@packages/scoutgame/projects/getUserScoutProjects';
import { ProjectsPage } from '@packages/scoutgame-ui/components/projects/ProjectsPage';

export default async function ProjectsPageContainer() {
  const session = await getSession();
  const scoutId = session.scoutId;

  if (!scoutId) {
    return null;
  }

  const allPromises = [getUserScoutProjects({ userId: scoutId })] as const;

  const [error, data] = await safeAwaitSSRData(Promise.all(allPromises));

  if (error) {
    return null;
  }

  const [projects] = data;

  return <ProjectsPage projects={projects} />;
}
