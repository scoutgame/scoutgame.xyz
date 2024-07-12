import type { ProjectField, ProjectAndMembersFieldConfig, ProjectMemberField } from '@root/lib/projects/formField';
import type { ProjectWithMembers } from '@root/lib/projects/interfaces';

export function getProposalProjectFormAnswers({
  canViewPrivateFields,
  projectWithMembers,
  fieldConfig
}: {
  fieldConfig: ProjectAndMembersFieldConfig;
  projectWithMembers: ProjectWithMembers;
  canViewPrivateFields: boolean;
}): ProjectWithMembers {
  if (canViewPrivateFields) return projectWithMembers;

  const privateProjectFields = Object.entries(fieldConfig)
    .filter(([, config]) => config?.private === true)
    .map(([key]) => key) as ProjectField[];

  const privateProjectMemberFields = Object.entries(fieldConfig.projectMember)
    .filter(([, config]) => config?.private === true)
    .map(([key]) => key) as ProjectMemberField[];

  privateProjectFields.forEach((key) => {
    if (key in projectWithMembers) {
      if (key === 'deletedAt') {
        projectWithMembers[key] = null;
      } else {
        projectWithMembers[key] = '';
      }
    }
  });

  projectWithMembers.projectMembers.forEach((projectMember) => {
    privateProjectMemberFields.forEach((key) => {
      if (key in projectMember) {
        if (key === 'teamLead') {
          projectMember[key] = false;
        } else {
          projectMember[key] = '';
        }
      }
    });
  });

  return projectWithMembers;
}
