import { Checkbox, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';

import { projectFieldProperties, projectMemberFieldProperties } from 'lib/projects/formField';

import type { SelectedProposalProperties } from './ProposalSourcePropertiesDialog';
import { SelectedPropertiesList } from './SelectedPropertiesList';

const projectMemberFields = projectMemberFieldProperties.map((propertyFieldProperty) => propertyFieldProperty.field);
const projectFields = projectFieldProperties.map((propertyFieldProperty) => propertyFieldProperty.field);

export function ProjectProfilePropertiesList({
  selectedProperties,
  setSelectedProperties
}: {
  setSelectedProperties: (selectedProperties: SelectedProposalProperties) => void;
  selectedProperties: SelectedProposalProperties;
}) {
  const isAllProjectMemberPropertiesSelected =
    selectedProperties.projectMember.length === projectMemberFieldProperties.length;

  const isAllProjectPropertiesSelected =
    selectedProperties.project.length === projectFieldProperties.length && isAllProjectMemberPropertiesSelected;

  return (
    <Stack>
      <Stack direction='row' alignItems='center'>
        <Checkbox
          size='small'
          checked={isAllProjectPropertiesSelected}
          onChange={() => {
            setSelectedProperties(
              isAllProjectPropertiesSelected
                ? {
                    projectMember: [],
                    project: [],
                    defaults: [],
                    formFields: [],
                    rubricEvaluations: [],
                    customProperties: []
                  }
                : {
                    ...selectedProperties,
                    projectMember: [...projectMemberFields],
                    project: [...projectFields]
                  }
            );
          }}
        />
        <Typography fontWeight='bold'>Project Profile</Typography>
      </Stack>
      <Stack ml={2}>
        {projectFieldProperties.map((propertyFieldProperty) => (
          <Stack
            onClick={() => {
              const isChecked = selectedProperties.project.includes(propertyFieldProperty.field);
              setSelectedProperties({
                ...selectedProperties,
                project: isChecked
                  ? selectedProperties.project.filter(
                      (selectedProperty) => selectedProperty !== propertyFieldProperty.field
                    )
                  : [...selectedProperties.project, propertyFieldProperty.field]
              });
            }}
            alignItems='center'
            direction='row'
            sx={{
              cursor: 'pointer'
            }}
            key={propertyFieldProperty.field}
          >
            <Checkbox size='small' checked={selectedProperties.project.includes(propertyFieldProperty.field)} />
            <Typography>{propertyFieldProperty.columnTitle}</Typography>
          </Stack>
        ))}
        <Stack
          direction='row'
          alignItems='center'
          sx={{
            cursor: 'pointer'
          }}
          onClick={() => {
            setSelectedProperties({
              ...selectedProperties,
              projectMember: isAllProjectMemberPropertiesSelected ? [] : [...projectMemberFields]
            });
          }}
        >
          <Checkbox size='small' checked={isAllProjectMemberPropertiesSelected} />
          <Typography fontWeight='bold'>Project Member</Typography>
        </Stack>
        <Stack ml={2}>
          {projectMemberFieldProperties.map((projectMemberFieldProperty) => (
            <Stack
              onClick={() => {
                const isChecked = selectedProperties.projectMember.includes(projectMemberFieldProperty.field);
                setSelectedProperties({
                  ...selectedProperties,
                  projectMember: isChecked
                    ? selectedProperties.projectMember.filter(
                        (selectedProperty) => selectedProperty !== projectMemberFieldProperty.field
                      )
                    : [...selectedProperties.projectMember, projectMemberFieldProperty.field]
                });
              }}
              alignItems='center'
              direction='row'
              sx={{
                cursor: 'pointer'
              }}
              key={projectMemberFieldProperty.field}
            >
              <Checkbox
                size='small'
                checked={selectedProperties.projectMember.includes(projectMemberFieldProperty.field)}
              />
              <Typography>{projectMemberFieldProperty.label}</Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}

export function ProjectProfilePropertiesReadonlyList({
  selectedProperties
}: {
  selectedProperties: SelectedProposalProperties;
}) {
  const { selectedProjectFields, selectedProjectMemberFields } = useMemo(() => {
    return {
      selectedProjectFields: projectFieldProperties.filter((propertyFieldProperty) =>
        selectedProperties.project.includes(propertyFieldProperty.field)
      ),
      selectedProjectMemberFields: projectMemberFieldProperties.filter((propertyFieldProperty) =>
        selectedProperties.projectMember.includes(propertyFieldProperty.field)
      )
    };
  }, [selectedProperties]);

  if (selectedProjectFields.length === 0 && selectedProjectMemberFields.length === 0) {
    return null;
  }

  return (
    <SelectedPropertiesList
      items={selectedProjectFields.map((propertyFieldProperty) => propertyFieldProperty.columnTitle)}
      title='Project Profile'
    >
      {selectedProjectMemberFields.length === 0 ? null : (
        <SelectedPropertiesList
          items={selectedProjectMemberFields.map((projectMemberFieldProperty) => projectMemberFieldProperty.label)}
          title='Project Member'
        />
      )}
    </SelectedPropertiesList>
  );
}
