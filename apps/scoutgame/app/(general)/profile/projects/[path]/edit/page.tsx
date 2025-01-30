import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { getProjectByPath } from '@packages/scoutgame/projects/getProjectByPath';
import { EditProjectPage } from '@packages/scoutgame-ui/components/projects/[path]/edit/EditProjectPage';
import { notFound, redirect } from 'next/navigation';

export default async function Page({ params }: { params: { path: string } }) {
  const project = await getProjectByPath(params.path);
  if (!project) {
    return notFound();
  }
  const user = await getUserFromSession();
  const isOwner = user && user.id === project.teamMembers.find((member) => member.role === 'owner')?.id;

  if (!isOwner) {
    return redirect(`/p/${project.path}`);
  }

  return <EditProjectPage project={project} />;
}
