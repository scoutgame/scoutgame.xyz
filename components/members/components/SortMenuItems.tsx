import {
  ArrowDownwardOutlined as ArrowDownwardOutlinedIcon,
  ArrowUpwardOutlined as ArrowUpwardOutlinedIcon
} from '@mui/icons-material';
import { ListItemIcon, ListItemText, MenuItem } from '@mui/material';

import { iconForPropertyType } from 'components/common/DatabaseEditor/widgets/iconForPropertyType';
import type { PropertyType } from 'lib/databases/board';

export type SortValue = 'join_date' | 'username';
type SortOptionItem = { value: SortValue; label: string; iconType: PropertyType };

const sortOptions: SortOptionItem[] = [
  {
    value: 'join_date',
    label: 'Join Date',
    iconType: 'date'
  },
  {
    value: 'username',
    label: 'Username',
    iconType: 'text'
  }
];

export function SortMenuItems({
  value: currentValue,
  reversed,
  onChange
}: {
  value: SortValue;
  reversed: boolean;
  onChange: (change: { reversed: boolean; value: SortValue }) => void;
}) {
  function _onChange(value: SortValue) {
    if (currentValue === value) {
      // Already sorting by name, so reverse it
      onChange({ value, reversed: !reversed });
    } else {
      onChange({ value, reversed: false });
    }
  }

  return (
    <>
      {sortOptions.map((option) => {
        let rightIcon: JSX.Element | undefined;
        if (sortOptions?.length > 0) {
          if (currentValue === option.value) {
            rightIcon = reversed ? (
              <ArrowDownwardOutlinedIcon color='secondary' fontSize='small' />
            ) : (
              <ArrowUpwardOutlinedIcon color='secondary' fontSize='small' />
            );
          }
        }
        return (
          <MenuItem key={option.value} onClick={() => _onChange(option.value)}>
            <ListItemIcon>{iconForPropertyType(option.iconType)}</ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
            {/* override minWidth from global theme */}
            <ListItemIcon sx={{ minWidth: '0 !important' }}>{rightIcon}</ListItemIcon>
          </MenuItem>
        );
      })}
    </>
  );
}
