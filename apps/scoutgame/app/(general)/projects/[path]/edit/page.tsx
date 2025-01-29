import { getProjectByPath } from '@packages/scoutgame/projects/getProjectByPath';
import { EditProjectPage } from '@packages/scoutgame-ui/components/projects/[path]/edit/EditProjectPage';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: { path: string } }) {
  const project = await getProjectByPath(params.path);
  if (!project) {
    return notFound();
  }
  return <EditProjectPage project={project} />;
}
