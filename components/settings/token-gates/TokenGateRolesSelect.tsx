import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useMemo } from 'react';
import FormControl from '@mui/material/FormControl';
import { ListSpaceRolesResponse } from 'charmClient';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import useIsAdmin from 'hooks/useIsAdmin';
import useRoles from '../roles/hooks/useRoles';

/**
 * @renderSelected Show selected options in the options menu. Default is true.
 */
interface Props {
  onChange: (roleIds: string[]) => void
  selectedRoleIds: string[]
  onDelete: (roleId: string) => void
}

export default function TokenGateRolesSelect ({ onDelete, selectedRoleIds, onChange }: Props) {
  const { roles } = useRoles();

  const rolesRecord: Record<string, ListSpaceRolesResponse> = useMemo(() => roles ? roles?.reduce((obj, role) => (
    { ...obj, [role.id]: role }
  ), {}) : {}, [roles]);

  async function selectOption (ev: SelectChangeEvent<string[]>) {
    ev.preventDefault();
    onChange(ev.target.value as string[]);
  }

  const isAdmin = useIsAdmin();

  return (
    <FormControl sx={{ maxWidth: 250 }}>
      <Select<string[]>
        sx={{
          '& .MuiSelect-icon': {
            top: '8px',
            position: 'absolute'
          }
        }}
        variant='outlined'
        value={selectedRoleIds}
        multiple
        onChange={selectOption}
        displayEmpty={true}
        disabled={!isAdmin || roles?.length === 0}
        renderValue={(roleIds) => (
          (roleIds.length === 0) ? (
            'Attach roles'
          ) : (
            <Stack direction='column' spacing={1}>
              {
                roleIds.map(roleId => {
                  return rolesRecord[roleId] && (
                    <Chip
                      sx={{
                        width: 'fit-content'
                      }}
                      key={roleId}
                      label={rolesRecord[roleId].name}
                      variant='outlined'
                      onMouseDown={(event) => {
                        event.stopPropagation();
                      }}
                      disabled={!isAdmin}
                      onDelete={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(roleId);
                      }}
                    />
                  );
                })
              }
            </Stack>
          )
        )}
      >
        {roles?.map(role => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}
      </Select>
    </FormControl>
  );
}

