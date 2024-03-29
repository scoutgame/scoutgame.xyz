import * as http from 'adapters/http';
import type { ProjectValues, ProjectWithMembers } from 'lib/projects/interfaces';

export class ProjectsApi {
  removeProjectMember({ projectId, memberId }: { projectId: string; memberId: string }) {
    return http.DELETE(`/api/projects/${projectId}/members/${memberId}`);
  }

  updateProject(projectId: string, payload: ProjectValues) {
    return http.PUT<ProjectWithMembers>(`/api/projects/${projectId}`, payload);
  }

  updateProjectMember({
    projectId,
    memberId,
    payload
  }: {
    projectId: string;
    memberId: string;
    payload: ProjectValues['projectMembers'][0];
  }) {
    return http.PUT<ProjectWithMembers['projectMembers'][number]>(
      `/api/projects/${projectId}/members/${memberId}`,
      payload
    );
  }
}
