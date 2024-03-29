import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';

import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { useUser } from 'hooks/useUser';
import { defaultProjectValues } from 'lib/projects/constants';
import type { ProjectFieldConfig, ProjectValues } from 'lib/projects/interfaces';

import { ProjectFieldAnswers, ProjectFieldsEditor } from './ProjectFields';
import { ProjectMemberFieldAnswers, ProjectMemberFieldsEditor } from './ProjectMemberFields';

export function ProjectFormAnswers({
  fieldConfig,
  isTeamLead,
  defaultRequired,
  hideTeamMembers = false
}: {
  fieldConfig?: ProjectFieldConfig;
  isTeamLead: boolean;
  defaultRequired?: boolean;
  hideTeamMembers?: boolean;
}) {
  const { getValues, setValue } = useFormContext<ProjectValues>();
  const projectValues = getValues();
  const { user } = useUser();
  const extraProjectMembers = projectValues.projectMembers.slice(1);

  return (
    <Stack gap={2} width='100%'>
      <Typography variant='h6'>Project Info</Typography>
      <ProjectFieldAnswers defaultRequired={defaultRequired} disabled={!isTeamLead} fieldConfig={fieldConfig} />
      <Typography variant='h6' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <ProjectMemberFieldAnswers
        projectMemberIndex={0}
        disabled={!isTeamLead}
        defaultRequired={defaultRequired}
        fieldConfig={fieldConfig?.projectMember}
      />
      {!hideTeamMembers && extraProjectMembers.length ? (
        <>
          <Divider
            sx={{
              my: 1
            }}
          />
          {extraProjectMembers.map((projectMember, index) => (
            <Stack key={`project-member-${index.toString()}`}>
              <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
                <Typography variant='h6'>Team member</Typography>
                {isTeamLead ? (
                  <DeleteOutlineOutlinedIcon
                    fontSize='small'
                    color='error'
                    onClick={() => {
                      setValue(
                        'projectMembers',
                        projectValues.projectMembers.filter((_, i) => i !== index + 1),
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true
                        }
                      );
                    }}
                  />
                ) : null}
              </Stack>
              <ProjectMemberFieldAnswers
                projectMemberIndex={index + 1}
                disabled={!(isTeamLead || projectMember.userId === user?.id)}
                defaultRequired={defaultRequired}
                fieldConfig={fieldConfig?.projectMember}
              />
            </Stack>
          ))}
          <Divider
            sx={{
              my: 1
            }}
          />
        </>
      ) : null}
      {!hideTeamMembers && (
        <Box
          sx={{
            mb: 2,
            width: 'fit-content'
          }}
        >
          <Button
            disabled={!isTeamLead}
            disabledTooltip='Only the team lead can add team members'
            startIcon={<AddIcon fontSize='small' />}
            onClick={() => {
              setValue('projectMembers', [...projectValues.projectMembers, defaultProjectValues.projectMembers[0]], {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true
              });
            }}
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
  fieldConfig,
  defaultRequired
}: {
  onChange?: (project: ProjectFieldConfig) => void;
  fieldConfig: ProjectFieldConfig;
  defaultRequired?: boolean;
}) {
  return (
    <Stack gap={2}>
      <Typography variant='h6'>Project Info</Typography>
      <ProjectFieldsEditor
        defaultRequired={defaultRequired}
        fieldConfig={fieldConfig}
        onChange={
          onChange === undefined
            ? undefined
            : (_fieldConfig) => {
                onChange?.({
                  ...fieldConfig,
                  ..._fieldConfig
                });
              }
        }
      />
      <Typography variant='h5' mt={2}>
        Team Info
      </Typography>
      <FieldLabel>Team Lead</FieldLabel>
      <ProjectMemberFieldsEditor
        defaultRequired={defaultRequired}
        fieldConfig={fieldConfig?.projectMember}
        onChange={
          onChange === undefined
            ? undefined
            : (memberFieldConfig) => {
                onChange?.({
                  ...fieldConfig,
                  projectMember: memberFieldConfig
                });
              }
        }
      />
    </Stack>
  );
}
