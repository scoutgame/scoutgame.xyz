import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

import { InputSearchMemberMultiple } from '../InputSearchMember';

type Props = ControlFieldProps & FieldProps;

export const PersonInputField = forwardRef<HTMLDivElement, Props>(
  ({ onChange, value, error, helperText, disabled, placeholder, fieldWrapperSx, ...inputProps }) => {
    return (
      <FieldWrapper sx={fieldWrapperSx} {...inputProps}>
        <InputSearchMemberMultiple
          onChange={(ids) => {
            onChange?.(ids);
          }}
          helperText={helperText}
          error={!!error}
          disabled={disabled}
          placeholder={placeholder}
          defaultValue={value as unknown as string[]}
        />
      </FieldWrapper>
    );
  }
);
