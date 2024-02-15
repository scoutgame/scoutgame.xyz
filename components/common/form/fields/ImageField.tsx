import { Typography } from '@mui/material';
import Image from 'next/image';

import { Button } from 'components/common/Button';
import ImageSelector from 'components/common/ImageSelector/ImageSelector';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ControlFieldProps, FieldProps } from '../interfaces';

import type { FieldWrapperProps } from './FieldWrapper';
import { FieldWrapper, FieldWrapperContainer, ReadonlyCharmContent } from './FieldWrapper';

type Props = ControlFieldProps &
  FieldProps &
  FieldWrapperProps & {
    description?: PageContent;
    imageUrl?: string;
  };

export function ImageField({ value, ...props }: Props) {
  return (
    <FieldWrapper {...props}>
      <ImageSelector onImageSelect={(newValue) => (props.onChange && newValue ? props.onChange(newValue) : null)}>
        <Button sx={{ my: 2 }} color='primary'>
          Choose image
        </Button>
        {value && <Image width={300} height={300} src={value as string} alt='user submission' />}
      </ImageSelector>
    </FieldWrapper>
  );
}
