import MuiAddIcon from '@mui/icons-material/Add';
import { Box, Divider, Stack, Typography } from '@mui/material';

import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';

import type { ProjectEditorFieldConfig, ProjectFieldConfig, ProjectValues } from './interfaces';
import { ProjectFieldAnswers, ProjectFieldsEditor } from './ProjectFields';
import {
  projectMemberDefaultValues,
  ProjectMemberFieldAnswers,
  ProjectMemberFieldsEditor
} from './ProjectMemberFields';

export function ProjectFormAnswers({
  onChange,
  values,
  fieldConfig,
  onMemberAdd,
  disableAddMemberButton,
  isTeamLead
}: {
  disableAddMemberButton?: boolean;
  values: ProjectValues;
  onChange?: (project: ProjectValues) => void;
  fieldConfig?: ProjectEditorFieldConfig;
  onMemberAdd?: () => void;
  isTeamLead: boolean;
}) {
  return (
    <Stack gap={2} width='100%'>
      <Typography variant='h5'>Project Info</Typography>
      <ProjectFieldAnswers
        values={values}
        onChange={
          onChange === undefined || !isTeamLead
            ? undefined
            : (_project) => {
                onChange({
                  ...values,
                  ..._project
                });
              }
        }
        fieldConfig={fieldConfig as ProjectFieldConfig}
      />
      <Typography variant='h5' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <ProjectMemberFieldAnswers
        onChange={
          onChange === undefined || !isTeamLead
            ? undefined
            : (projectMember) => {
                onChange({
                  ...values,
                  projectMembers: [projectMember, ...values.projectMembers.slice(1)]
                });
              }
        }
        fieldConfig={fieldConfig?.projectMembers?.[0]}
        values={values.projectMembers[0] ?? projectMemberDefaultValues}
      />
      <Divider
        sx={{
          my: 1
        }}
      />

      {values.projectMembers.slice(1).map((member, index) => (
        <>
          <FieldLabel>Team member</FieldLabel>
          <ProjectMemberFieldAnswers
            onChange={
              onChange === undefined || !isTeamLead
                ? undefined
                : (projectMember) => {
                    onChange({
                      ...values,
                      projectMembers: [
                        ...values.projectMembers.slice(0, index + 1),
                        projectMember,
                        ...values.projectMembers.slice(index + 2)
                      ]
                    });
                  }
            }
            fieldConfig={fieldConfig?.projectMembers[index + 1]}
            values={member}
          />
          <Divider
            sx={{
              my: 1
            }}
          />
        </>
      ))}
      {onChange && (
        <Box
          sx={{
            width: 'fit-content'
          }}
        >
          <Button
            disabledTooltip={!isTeamLead ? 'You must be a team lead to add a team member' : undefined}
            disabled={disableAddMemberButton || !isTeamLead}
            startIcon={<MuiAddIcon fontSize='small' />}
            onClick={onMemberAdd}
          >
            Add a team member
          </Button>
        </Box>
      )}
    </Stack>
  );
}

export function ProjectFormEditor({
  onChange,
  values
}: {
  onChange?: (project: ProjectEditorFieldConfig) => void;
  values: ProjectEditorFieldConfig;
}) {
  return (
    <Stack gap={2} p={2}>
      <Typography variant='h5'>Project Info</Typography>
      <ProjectFieldsEditor
        values={values}
        onChange={
          onChange === undefined
            ? undefined
            : (_project) => {
                onChange?.({
                  ...values,
                  ..._project
                });
              }
        }
      />
      <Typography variant='h5' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <ProjectMemberFieldsEditor
        values={values?.projectMembers?.[0]}
        onChange={
          onChange === undefined
            ? undefined
            : (member) => {
                onChange?.({
                  ...values,
                  projectMembers: [member, ...(values.projectMembers?.slice(1) ?? [])]
                });
              }
        }
      />
    </Stack>
  );
}
