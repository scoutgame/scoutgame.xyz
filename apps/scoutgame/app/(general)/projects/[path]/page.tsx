import { getProjectByPath } from '@packages/scoutgame/projects/getProjectByPath';
import { ProjectPage } from '@packages/scoutgame-ui/components/projects/ProjectPage/ProjectPage';
import { notFound } from 'next/navigation';

export default async function Project({ params }: { params: { path: string } }) {
  const project = await getProjectByPath(params.path);

  if (!project) {
    return notFound();
  }

  return <ProjectPage project={project} />;
}
