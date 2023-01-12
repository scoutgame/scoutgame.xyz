import type { CSSObject } from '@emotion/serialize';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import React from 'react';
import { useIntl } from 'react-intl';
import type { ActionMeta, OnChangeValue, Options } from 'react-select';
import CreatableSelect from 'react-select/creatable';

import type { IPropertyOption } from 'lib/focalboard/board';

import { Constants } from '../constants';
import { getSelectBaseStyle } from '../theme';

import IconButton from './buttons/iconButton';
import Label from './label';
import Menu from './menu';
import MenuWrapper from './menuWrapper';

interface FormatOptionLabelMeta<Option> {
  context: 'menu' | 'value';
  inputValue: string;
  selectValue: Options<Option>;
}

type Props = {
  options: IPropertyOption[];
  value?: IPropertyOption | IPropertyOption[];
  emptyValue: string;
  onCreate: (value: string) => void;
  onChange: (value: string | string[]) => void;
  onChangeColor: (option: IPropertyOption, color: string) => void;
  onDeleteOption: (option: IPropertyOption) => void;
  isMulti?: boolean;
  onDeleteValue?: (value: IPropertyOption) => void;
  onBlur?: () => void;
};

type LabelProps = {
  option: IPropertyOption;
  meta: FormatOptionLabelMeta<IPropertyOption>;
  onChangeColor: (option: IPropertyOption, color: string) => void;
  onDeleteOption: (option: IPropertyOption) => void;
  onDeleteValue?: (value: IPropertyOption) => void;
  isMulti?: boolean;
};

const ValueSelectorLabel = React.memo((props: LabelProps): JSX.Element => {
  const { option, onDeleteValue, meta, isMulti } = props;
  const intl = useIntl();
  if (meta.context === 'value') {
    let className = onDeleteValue ? 'Label-no-padding' : 'Label-single-select';
    if (!isMulti) {
      className += ' Label-no-margin';
    }
    return (
      <Label color={option.color} className={className}>
        <span className='Label-text'>{option.value}</span>
        {onDeleteValue && (
          <IconButton
            onClick={() => onDeleteValue(option)}
            icon={<CloseOutlinedIcon fontSize='small' />}
            title='Clear'
            className='margin-left delete-value'
          />
        )}
      </Label>
    );
  }
  return (
    <div className='value-menu-option'>
      <div className='label-container'>
        <Label color={option.color}>{option.value}</Label>
      </div>
      <MenuWrapper stopPropagationOnToggle={true}>
        <IconButton
          title={intl.formatMessage({ id: 'ValueSelectorLabel.openMenu', defaultMessage: 'Open menu' })}
          icon={<MoreHorizOutlinedIcon fontSize='small' />}
        />
        <Menu position='bottom'>
          <Menu.Text
            id='delete'
            icon={<DeleteOutlinedIcon fontSize='small' />}
            name={intl.formatMessage({ id: 'BoardComponent.delete', defaultMessage: 'Delete' })}
            onClick={() => props.onDeleteOption(option)}
          />
          <Menu.Separator />
          {Object.entries(Constants.menuColors).map(([key, color]: [string, string]) => (
            <Menu.Color key={key} id={key} name={color} onClick={() => props.onChangeColor(option, key)} />
          ))}
        </Menu>
      </MenuWrapper>
    </div>
  );
});

const valueSelectorStyle = {
  ...getSelectBaseStyle(),
  option: (provided: CSSObject, state: { isFocused: boolean }): CSSObject => ({
    ...provided,
    background: state.isFocused ? 'rgba(var(--center-channel-color-rgb), 0.1)' : 'rgb(var(--center-channel-bg-rgb))',
    color: state.isFocused ? 'rgb(var(--center-channel-color-rgb))' : 'rgb(var(--center-channel-color-rgb))',
    padding: '8px'
  }),
  control: (): CSSObject => ({
    border: 0,
    width: '100%',
    margin: '0'
  }),
  valueContainer: (provided: CSSObject): CSSObject => ({
    ...provided,
    padding: '0 8px',
    overflow: 'unset'
  }),
  singleValue: (provided: CSSObject): CSSObject => ({
    ...provided,
    position: 'static',
    top: 'unset',
    transform: 'unset'
  }),
  placeholder: (provided: CSSObject): CSSObject => ({
    ...provided,
    color: 'rgba(var(--center-channel-color-rgb), 0.4)'
  }),
  multiValue: (provided: CSSObject): CSSObject => ({
    ...provided,
    margin: 0,
    padding: 0,
    backgroundColor: 'transparent'
  }),
  multiValueLabel: (provided: CSSObject): CSSObject => ({
    ...provided,
    display: 'flex',
    paddingLeft: 0,
    padding: 0
  }),
  multiValueRemove: (): CSSObject => ({
    display: 'none'
  }),
  menu: (provided: CSSObject): CSSObject => ({
    ...provided,
    width: 'unset',
    background: 'rgb(var(--center-channel-bg-rgb))',
    minWidth: '260px'
  }),
  input: (provided: CSSObject): CSSObject => ({
    ...provided,
    color: 'inherit'
  })
};

function ValueSelector(props: Props): JSX.Element {
  const intl = useIntl();
  return (
    <CreatableSelect
      noOptionsMessage={() =>
        intl.formatMessage({
          id: 'ValueSelector.noOptions',
          defaultMessage: 'No options. Start typing to add the first one!'
        })
      }
      aria-label={intl.formatMessage({ id: 'ValueSelector.valueSelector', defaultMessage: 'Value selector' })}
      captureMenuScroll={true}
      maxMenuHeight={1200}
      isMulti={props.isMulti}
      isClearable={true}
      styles={valueSelectorStyle}
      // eslint-disable-next-line react/no-unstable-nested-components
      formatOptionLabel={(option: IPropertyOption, meta: FormatOptionLabelMeta<IPropertyOption>) => (
        <ValueSelectorLabel
          option={option}
          meta={meta}
          isMulti={props.isMulti}
          onChangeColor={props.onChangeColor}
          onDeleteOption={props.onDeleteOption}
          onDeleteValue={props.onDeleteValue}
        />
      )}
      className='ValueSelector'
      options={props.options}
      getOptionLabel={(o: IPropertyOption) => o.value}
      getOptionValue={(o: IPropertyOption) => o.id}
      onChange={(value: OnChangeValue<IPropertyOption, true | false>, action: ActionMeta<IPropertyOption>): void => {
        if (action.action === 'select-option') {
          if (Array.isArray(value)) {
            props.onChange((value as IPropertyOption[]).map((option) => option.id));
          } else {
            props.onChange((value as IPropertyOption).id);
          }
        } else if (action.action === 'clear') {
          props.onChange('');
        }
      }}
      onBlur={props.onBlur}
      onCreateOption={props.onCreate}
      autoFocus={true}
      value={props.value || null}
      closeMenuOnSelect={true}
      placeholder={props.emptyValue}
      hideSelectedOptions={false}
      defaultMenuIsOpen={true}
    />
  );
}

export default ValueSelector;
