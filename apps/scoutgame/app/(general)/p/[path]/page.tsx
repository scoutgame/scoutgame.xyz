import { getProjectByPath } from '@packages/scoutgame/projects/getProjectByPath';
import { notFound } from 'next/navigation';

import { ProjectPage } from 'components/projects/[path]/ProjectPage';

export default async function Project({ params }: { params: { path: string } }) {
  const project = await getProjectByPath(params.path);

  if (!project) {
    return notFound();
  }

  return <ProjectPage project={project} />;
}
