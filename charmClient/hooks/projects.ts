import { useDELETE, useGET, usePOST, usePUT } from 'charmClient/hooks/helpers';
import type { ProjectValues, ProjectWithMembers } from 'lib/projects/interfaces';

export function useCreateProject() {
  return usePOST<ProjectValues, ProjectWithMembers>('/api/projects');
}

export function useGetProjects() {
  return useGET<ProjectWithMembers[]>('/api/projects');
}

export function useUpdateProject(projectId: string) {
  return usePUT<ProjectValues, ProjectWithMembers>(`/api/projects/${projectId}`);
}
