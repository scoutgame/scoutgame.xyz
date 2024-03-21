import { useGET, usePOST, usePUT } from 'charmClient/hooks/helpers';
import type { ProjectUpdatePayload, ProjectValues, ProjectWithMembers } from 'components/projects/interfaces';

export function useCreateProject() {
  return usePOST<ProjectValues, ProjectWithMembers>('/api/projects');
}

export function useGetProjects() {
  return useGET<ProjectWithMembers[]>('/api/projects');
}

export function useUpdateProject({ projectId }: { projectId: string }) {
  return usePUT<ProjectUpdatePayload, ProjectWithMembers>(`/api/projects/${projectId}`);
}
