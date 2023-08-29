import styled from '@emotion/styled';
import { Stack } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';

import {
  mapPropertyOptionToSelectOption,
  mapSelectOptionToPropertyOption
} from 'components/common/BoardEditor/components/properties/TagSelect/mappers';
import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectPreview } from 'components/common/form/fields/Select/SelectPreview';
import { SelectField } from 'components/common/form/fields/SelectField';
import { isEmptyValue } from 'components/common/form/fields/utils';
import type { IPropertyOption } from 'lib/focalboard/board';

type ContainerProps = {
  displayType?: PropertyValueDisplayType;
  isHidden?: boolean;
  readOnly?: boolean;
};
export const SelectPreviewContainer = styled(Stack, {
  shouldForwardProp: (prop: string) => prop !== 'displayType' && prop !== 'isHidden' && prop !== 'readOnly'
})<ContainerProps>`
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  display: ${({ isHidden }) => (isHidden ? 'none' : 'initial')};
  width: 100%;
  height: 100%;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(0.25, 0)};
  transition: background-color 0.2s ease-in-out;

  ${({ displayType, theme }) => {
    // Styles depending on a view type
    if (displayType === 'details') {
      return `
        min-height: 32px;
        min-width: 150px;
        padding: ${theme.spacing(0.5)} ${theme.spacing(1)};
        padding-right: ${theme.spacing(2)};
      `;
    }

    return '';
  }}

  ${({ readOnly, theme, displayType }) =>
    !readOnly &&
    `
    // disable hover UX on ios which converts first click to a hover event
    @media (pointer: fine) {
      &:hover {
        cursor: pointer;
        background-color: ${displayType === 'details' ? theme.palette.action.hover : 'transparent'};
      }
    }
    `}
`;

const StyledSelect = styled(SelectField)<ContainerProps>`
  flex-grow: 1;
  .MuiInputBase-root {
    background-color: ${({ theme }) => theme.palette.background.paper};

    ${({ displayType, theme }) =>
      displayType === 'table'
        ? `
        .MuiAutocomplete-input {
          width: 100%;
          border-top: 1px solid ${theme.palette.divider};
        }`
        : ''}
  }

  // override styles from focalboard
  .MuiInputBase-input {
    background: transparent;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  .MuiInputBase-root.MuiInputBase-sizeSmall {
    padding: 4px;
  }

  // hide blue outline around focused input
  .MuiOutlinedInput-notchedOutline {
    border: 0 none !important;
  }
`;

type Props = {
  readOnly?: boolean;
  readOnlyMessage?: string;
  canEditOptions?: boolean; // TODO: allow editing options
  multiselect?: boolean;
  noOptionsText?: string;
  options: IPropertyOption[];
  propertyValue: string | string[];
  displayType?: PropertyValueDisplayType;
  onChange: (option: string | string[]) => void;
  onCreateOption?: (option: IPropertyOption) => void;
  onUpdateOption?: (option: IPropertyOption) => void;
  onDeleteOption?: (option: IPropertyOption) => void;
  wrapColumn?: boolean;
  'data-test'?: string;
};

export function TagSelect({
  readOnly,
  readOnlyMessage,
  canEditOptions = false,
  options,
  propertyValue,
  multiselect = false,
  onChange,
  onUpdateOption,
  onDeleteOption,
  onCreateOption,
  displayType = 'details',
  noOptionsText,
  wrapColumn,
  'data-test': dataTest
}: Props) {
  const [isOpened, setIsOpened] = useState(false);

  const onEdit = useCallback(() => {
    if (!readOnly) {
      setIsOpened(true);
    }
  }, [readOnly]);

  const selectOptions = useMemo(() => {
    return options.map((o) => mapPropertyOptionToSelectOption(o));
  }, [options]);

  const selectValue = useMemo(() => {
    if (multiselect) {
      return typeof propertyValue === 'string' ? [propertyValue] : propertyValue;
    } else {
      return Array.isArray(propertyValue) ? propertyValue[0] || '' : propertyValue;
    }
  }, [multiselect, propertyValue]);

  const onUpdate = useCallback(
    (selectOption: SelectOptionType) => {
      const option = mapSelectOptionToPropertyOption(selectOption);
      onUpdateOption?.(option);
    },
    [onUpdateOption]
  );

  const onDelete = useCallback(
    (selectOption: SelectOptionType) => {
      const option = mapSelectOptionToPropertyOption(selectOption);
      onDeleteOption?.(option);
    },
    [onDeleteOption]
  );

  const onCreate = useCallback(
    (selectOption: SelectOptionType) => {
      const option = mapSelectOptionToPropertyOption(selectOption);
      onCreateOption?.(option);
    },
    [onCreateOption]
  );

  if (displayType === 'kanban' && isEmptyValue(selectValue)) {
    return null;
  }
  if (!isOpened) {
    return (
      <SelectPreviewContainer data-test={dataTest} onClick={onEdit} displayType={displayType} readOnly={readOnly}>
        <SelectPreview
          readOnly={readOnly}
          readOnlyMessage={readOnlyMessage}
          sx={{ height: '100%' }}
          wrapColumn={wrapColumn}
          value={selectValue}
          options={selectOptions}
          size='small'
          showEmpty={displayType === 'details'}
        />
      </SelectPreviewContainer>
    );
  }

  return (
    <StyledSelect
      data-test={dataTest}
      canEditOptions={canEditOptions}
      placeholder='Search for an option...'
      noOptionsText={noOptionsText}
      autoOpen
      multiselect={multiselect}
      disabled={readOnly}
      value={selectValue}
      options={selectOptions}
      onChange={onChange}
      onUpdateOption={onUpdate}
      onDeleteOption={onDelete}
      onCreateOption={onCreate}
      onBlur={() => setIsOpened(false)}
      forcePopupIcon={false}
      displayType={displayType}
    />
  );
}
