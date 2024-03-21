import AddIcon from '@mui/icons-material/Add';
import { Box, Divider, Stack } from '@mui/material';
import { useState } from 'react';

import { useCreateProject, useGetProjects } from 'charmClient/hooks/projects';
import { Button } from 'components/common/Button';
import type { ProjectValues, ProjectWithMembers } from 'components/projects/interfaces';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';
import { projectMemberDefaultValues } from 'components/projects/ProjectMemberFields';

import { useGetDefaultProject } from './hooks/useGetDefaultProject';

export function CreateProjectForm({
  onCancel,
  project: _project = null,
  onSave
}: {
  onSave?: (project: ProjectWithMembers) => void;
  onCancel?: VoidFunction;
  project?: ProjectValues | null;
}) {
  const defaultProject = useGetDefaultProject();
  const [project, setProject] = useState<ProjectValues | null>(_project);
  const { trigger: createProject, isMutating } = useCreateProject();
  const { mutate } = useGetProjects();

  async function saveProject() {
    if (!project) {
      return;
    }

    try {
      const createdProjectWithMember = await createProject(project);
      onSave?.(createdProjectWithMember);
      setProject(null);
      mutate(
        (cachedData) => {
          if (!cachedData) {
            return cachedData;
          }

          return [...cachedData, createdProjectWithMember];
        },
        {
          revalidate: false
        }
      );
    } catch (err) {
      //
    }
  }

  return (
    <>
      {project && (
        <Box mb={3}>
          <Divider
            sx={{
              my: 1
            }}
          />
          <ProjectFormAnswers
            defaultRequired={false}
            fieldConfig={{
              name: {
                required: true
              },
              projectMembers: project.projectMembers.map(() => ({
                name: {
                  required: true
                }
              }))
            }}
            onChange={setProject}
            isTeamLead
            onMemberRemove={(memberIndex) => {
              setProject({
                ...project,
                projectMembers: project.projectMembers.filter((_, index) => index !== memberIndex)
              });
            }}
            onMemberAdd={() => {
              setProject({
                ...project,
                projectMembers: [...project.projectMembers, projectMemberDefaultValues]
              });
            }}
            values={project}
          />
        </Box>
      )}

      {project ? (
        <Stack gap={1} flexDirection='row'>
          <Button disabled={isMutating} onClick={saveProject}>
            Save
          </Button>
          <Button
            disabled={isMutating}
            variant='outlined'
            color='error'
            onClick={() => {
              setProject(null);
              onCancel?.();
            }}
          >
            Cancel
          </Button>
        </Stack>
      ) : (
        <Button
          disabled={isMutating}
          onClick={() => {
            setProject(defaultProject);
          }}
          startIcon={<AddIcon fontSize='small' />}
        >
          Add a project
        </Button>
      )}
    </>
  );
}
