import { Stack } from '@mui/material';
import type { Path } from 'react-hook-form';
import { useController, useFormContext } from 'react-hook-form';

import { TextInputField } from 'components/common/form/fields/TextInputField';

import type { ProjectFieldConfig, ProjectFieldProperty, ProjectValues } from '../interfaces';

function FieldAnswer({
  property,
  fieldConfig,
  defaultRequired,
  name,
  disabled
}: {
  disabled?: boolean;
  name: Path<ProjectValues>;
  defaultRequired?: boolean;
  property: ProjectFieldProperty;
  fieldConfig?: ProjectFieldConfig;
}) {
  const { setValue, control } = useFormContext<ProjectValues>();

  const { field, fieldState } = useController({
    control,
    name
  });

  const isHidden = fieldConfig?.[property.field]?.hidden ?? false;
  if (isHidden) {
    return null;
  }

  return (
    <TextInputField
      key={property.label}
      label={property.label}
      multiline={property.multiline}
      rows={property.rows ?? 1}
      required={fieldConfig?.[property.field]?.required ?? defaultRequired}
      disabled={disabled}
      value={(field.value as string) ?? ''}
      error={fieldState.error?.message}
      onChange={(e) => {
        const newValue = e.target.value;
        setValue(name, newValue, {
          shouldTouch: true,
          shouldDirty: true,
          shouldValidate: true
        });
      }}
    />
  );
}

export function FieldAnswers({
  fieldConfig,
  properties,
  defaultRequired = false,
  name,
  disabled
}: {
  disabled?: boolean;
  name?: string;
  defaultRequired?: boolean;
  fieldConfig?: ProjectFieldConfig;
  properties: ProjectFieldProperty[];
}) {
  return (
    <Stack display='flex' flexDirection='column' gap={2} width='100%'>
      {properties.map((property) => (
        <FieldAnswer
          name={(name ? `${name}.${property.field}` : property.field) as Path<ProjectValues>}
          defaultRequired={defaultRequired}
          fieldConfig={fieldConfig}
          key={property.field as string}
          disabled={disabled}
          property={property}
        />
      ))}
    </Stack>
  );
}
