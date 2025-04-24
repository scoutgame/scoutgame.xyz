import { getProjectByPath } from '@packages/scoutgame/projects/getProjectByPath';
import { notFound } from 'next/navigation';

import { ProjectPage } from 'components/projects/[path]/ProjectPage';

export default async function Project({ params }: { params: Promise<{ path: string }> }) {
  const paramsResolved = await params;
  const project = await getProjectByPath(paramsResolved.path);

  if (!project) {
    return notFound();
  }

  return <ProjectPage project={project} />;
}
