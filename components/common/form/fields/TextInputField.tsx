import LinkIcon from '@mui/icons-material/Link';
import { Box, IconButton } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import TextField from '@mui/material/TextField';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

type Props = ControlFieldProps &
  FieldProps & { multiline?: boolean; inputEndAdornmentAlignItems?: string; rows?: number; maxRows?: number };

export const TextInputField = forwardRef<HTMLDivElement, Props>(
  (
    {
      label,
      labelEndAdornment,
      inputEndAdornment,
      inputEndAdornmentAlignItems,
      iconLabel,
      inline,
      error,
      description,
      multiline = false,
      required,
      topComponent,
      ...inputProps
    },
    ref
  ) => {
    return (
      <FieldWrapper
        inputEndAdornmentAlignItems={inputEndAdornmentAlignItems || multiline ? 'flex-start' : 'center'}
        labelEndAdornment={labelEndAdornment}
        inputEndAdornment={inputEndAdornment}
        description={description}
        required={required}
        label={label}
        inline={inline}
        iconLabel={iconLabel}
        error={!!error}
      >
        {/** Without label the field wrapper wraps its children inside a Fragment and if the container already has spacing it creates an uneven spacing with the extra margin bottom */}
        {topComponent && <Box mb={label ? 1 : 0}>{topComponent}</Box>}
        <CustomTextField
          // InputProps={{ className: 'Mui-error' }}
          error={!!error}
          fullWidth
          required={required}
          multiline={multiline}
          {...inputProps}
          ref={ref}
        />
      </FieldWrapper>
    );
  }
);

export function CustomTextField({ error, ...props }: TextFieldProps & { error?: boolean }) {
  const showLinkIcon = typeof props.value === 'string' && props.value.startsWith('http');
  const InputProps = showLinkIcon
    ? {
        endAdornment: (
          <IconButton color='secondary' href={props.value as string} target='_blank' size='small' sx={{ p: 0 }}>
            <LinkIcon />
          </IconButton>
        )
      }
    : undefined;

  return (
    <TextField
      disabled={props.disabled}
      fullWidth
      placeholder={props.placeholder}
      InputProps={InputProps}
      error={error}
      {...props}
    />
  );
}
