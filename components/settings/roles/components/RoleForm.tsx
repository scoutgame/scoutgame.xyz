import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import { Role } from '@prisma/client';
import Button from 'components/common/Button';
import useRoles from 'components/settings/roles/hooks/useRoles';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

export const schema = yup.object({
  name: yup.string().required('Please provide a valid role name')
});

type FormValues = yup.InferType<typeof schema>

interface Props {
  submitted?: (value: Pick<Role, 'name'>) => void
  role?: Pick<Role, 'name'>
  mode: 'create' | 'edit'
}

export default function RoleForm ({ role, mode = 'create', submitted = () => {} }: Props) {

  const {
    assignRoles,
    createRole,
    deleteRole,
    listRoles,
    unassignRole,
    roles
  } = useRoles();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    mode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: {
      name: role?.name
    }
  });

  return (
    <form
      onSubmit={handleSubmit(formValue => {
        if (mode === 'edit') {
          console.log('editing role', formValue);
        }
        else {
          createRole(formValue)
            .then(() => {
              submitted(formValue);
            });
        }

      })}
      style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}
    >
      <Grid container direction='column' spacing={3}>
        <Grid item>
          <InputLabel>
            Role name
          </InputLabel>
          <TextField
            {...register('name')}
            autoFocus
            placeholder='Bounty manager'
            variant='outlined'
            type='text'
            fullWidth
          />
          {
                errors?.name && (
                  <Alert severity='error'>
                    {errors.name.message}
                  </Alert>
                )
              }
        </Grid>
        <Grid item>
          <Button disabled={!isValid} type='submit'>Create role</Button>
        </Grid>
      </Grid>

    </form>
  );

}
