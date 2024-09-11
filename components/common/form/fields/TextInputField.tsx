import styled from '@emotion/styled';
import LinkIcon from '@mui/icons-material/Link';
import { Box, IconButton, Link, TextField } from '@mui/material';
import type { TextFieldProps, InputProps, InputBaseComponentProps } from '@mui/material';
import { forwardRef, useMemo } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

// In readonly mode, use a div instead of input/textarea so that we can use anchor tags
const ReadOnlyText = styled.div`
  cursor: text;
  white-space: pre-wrap;
`;

// Convert a string into a React component, and wrap links with anchor tags
function LinkifiedValue({ value }: { value?: string }): JSX.Element {
  return (
    <ReadOnlyText>
      {(value || '').split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
        part.startsWith('http') ? (
          <Link
            underline='always' // matches inline charm editor
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            href={part}
            target='_blank'
            rel='noopener noreferrer'
          >
            {part}
          </Link>
        ) : (
          part
        )
      )}
    </ReadOnlyText>
  );
}

type Props = ControlFieldProps &
  FieldProps & { multiline?: boolean; inputEndAdornmentAlignItems?: string; rows?: number; maxRows?: number };

export const CustomTextField = forwardRef<HTMLDivElement, TextFieldProps & { error?: boolean }>(
  ({ error, ...props }, ref) => {
    const InputProps = useMemo<Partial<InputProps> | undefined>(() => {
      if (props.disabled) {
        return {
          // eslint-disable-next-line react/no-unstable-nested-components
          inputComponent: (_props: InputBaseComponentProps) => <LinkifiedValue value={props.value as string} />
        };
      } else if (typeof props.value === 'string' && props.value.startsWith('http')) {
        // for admins, add an icon to open the link in a new tab even if the field is not disabled
        return {
          endAdornment: (
            <IconButton color='secondary' href={props.value as string} target='_blank' size='small' sx={{ p: 0 }}>
              <LinkIcon />
            </IconButton>
          )
        };
      }
      return undefined;
    }, [props.disabled, props.value]);

    return (
      <TextField ref={ref} fullWidth placeholder={props.placeholder} InputProps={InputProps} error={error} {...props} />
    );
  }
);

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
