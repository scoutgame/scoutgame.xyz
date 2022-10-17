
import type { JSXElementConstructor, ReactElement } from 'react';
import type { RegisterOptions } from 'react-hook-form';

import { FieldTypeRenderer } from 'components/common/form/fields/FieldTypeRenderer';
import type { ControlFieldProps, FieldProps, FieldType } from 'components/common/form/interfaces';

type Props = {
  type: FieldType;
} & FieldProps;

type FiedRenderedConfig = {
  rules: RegisterOptions;
  renderer: (fieldProps: { field: ControlFieldProps }) => ReactElement<any, string | JSXElementConstructor<any>>;
}

export function getFieldRendererConfig ({ type, ...fieldProps }: Props): FiedRenderedConfig {
  return {
    rules: getFieldTypeRules(type),
    renderer: ({ field }: { field: ControlFieldProps }) => <FieldTypeRenderer {...field} {...fieldProps} type={type} />
  };
}

function getFieldTypeRules (type: FieldType): RegisterOptions {
  // return validation rules for field like email etc
  switch (type) {
    case 'number': {
      return {
        pattern: /^(0|[1-9]\d*)(\.\d+)?$/
      };
    }

    default: {
      return {};
    }
  }
}
