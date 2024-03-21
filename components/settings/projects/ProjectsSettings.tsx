import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Divider, Typography, Accordion, AccordionDetails, AccordionSummary, Stack } from '@mui/material';
import debounce from 'lodash/debounce';
import { useMemo, useState } from 'react';
import type { KeyedMutator } from 'swr';

import { useCreateProject, useGetProjects, useUpdateProject } from 'charmClient/hooks/projects';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import type { ProjectUpdatePayload, ProjectValues, ProjectWithMembers } from 'components/projects/interfaces';
import { projectDefaultValues } from 'components/projects/ProjectFields';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';
import { projectMemberDefaultValues } from 'components/projects/ProjectMemberFields';
import Legend from 'components/settings/Legend';

const defaultFieldConfig = {
  name: {
    required: true
  },
  projectMembers: [
    {
      name: {
        required: true
      }
    }
  ]
};

function ProjectRow({
  mutate,
  projectWithMember
}: {
  projectWithMember: ProjectWithMembers;
  mutate: KeyedMutator<ProjectWithMembers[]>;
}) {
  const { trigger: updateProject } = useUpdateProject({ projectId: projectWithMember.id });

  const debouncedUpdate = useMemo(() => {
    return debounce(updateProject, 300);
  }, [updateProject]);

  async function onProjectUpdate(_project: ProjectValues) {
    try {
      // Add ids to project & projectMembers
      await debouncedUpdate({
        id: projectWithMember.id,
        ..._project,
        projectMembers: _project.projectMembers.map((projectMember, index) => {
          return {
            ...projectWithMember.projectMembers[index],
            ...projectMember
          };
        })
      });

      mutate(
        (cachedData) => {
          if (!cachedData) {
            return cachedData;
          }

          return cachedData.map((project) => {
            if (project.id === projectWithMember.id) {
              return {
                ...project,
                ..._project,
                projectMembers: _project.projectMembers.map((projectMember, index) => {
                  return {
                    ...project.projectMembers[index],
                    ...projectMember
                  };
                })
              };
            }

            return project;
          });
        },
        {
          revalidate: false
        }
      );
    } catch (_) {
      //
    }
  }

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{projectWithMember.name}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <ProjectFormAnswers fieldConfig={defaultFieldConfig} onChange={onProjectUpdate} values={projectWithMember} />
      </AccordionDetails>
    </Accordion>
  );
}

export function ProjectsSettings() {
  useTrackPageView({ type: 'settings/my-projects' });
  const [project, setProject] = useState<ProjectValues | null>(null);
  const { trigger: createProject, isMutating } = useCreateProject();
  const { mutate, data } = useGetProjects();

  async function saveProject() {
    if (!project) {
      return;
    }

    try {
      const createdProjectWithMember = await createProject(project);
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
      <Legend>My Projects</Legend>
      <Typography variant='h6'>Projects</Typography>
      <Typography variant='caption' mb={1} component='p'>
        Projects can be used to autofill proposal and grant request information.
      </Typography>

      {data && data.length !== 0 && (
        <Box mb={3}>
          {data.map((projectWithMember) => (
            <ProjectRow mutate={mutate} key={projectWithMember.id} projectWithMember={projectWithMember} />
          ))}
        </Box>
      )}

      {project && (
        <Box mb={3}>
          <Divider
            sx={{
              my: 1
            }}
          />
          <ProjectFormAnswers fieldConfig={defaultFieldConfig} onChange={setProject} values={project} />
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
            }}
          >
            Cancel
          </Button>
        </Stack>
      ) : (
        <Button
          disabled={isMutating}
          onClick={() => {
            setProject({
              ...projectDefaultValues,
              projectMembers: [projectMemberDefaultValues]
            });
          }}
          startIcon={<AddIcon fontSize='small' />}
        >
          Add a project
        </Button>
      )}
    </>
  );
}
