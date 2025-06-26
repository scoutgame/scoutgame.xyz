import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { Stack, Typography, Button, IconButton, Box, TextField } from '@mui/material';
import type { Control, FieldErrors } from 'react-hook-form';
import { useFieldArray, Controller } from 'react-hook-form';

export type IssueTagAmount = {
  tag: string;
  amount: number;
};

type FormValues = {
  issueTagTokenAmounts: IssueTagAmount[];
};

type Props = {
  control: Control<any>;
  errors?: FieldErrors<any>;
};

export function IssueTagAmountFields({ control, errors }: Props) {
  const { fields, append, remove } = useFieldArray<FormValues>({
    control,
    name: 'issueTagTokenAmounts'
  });

  return (
    <Stack spacing={2}>
      <Stack direction='row' justifyContent='space-between' alignItems='center'>
        <Typography variant='subtitle1'>Issue Tag Token Amounts</Typography>
        <Button
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => append({ tag: '', amount: 0 })}
          variant='outlined'
          size='small'
        >
          Add Tag
        </Button>
      </Stack>

      {fields.map((arrayField, index) => (
        <Box key={arrayField.id} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Controller
            name={`issueTagTokenAmounts.${index}.tag`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                sx={{ flex: 1 }}
                label='Tag'
                error={!!errors?.[`issueTagTokenAmounts.${index}.tag`]}
                helperText={errors?.[`issueTagTokenAmounts.${index}.tag`]?.message as string}
                size='small'
              />
            )}
          />
          <Controller
            name={`issueTagTokenAmounts.${index}.amount`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type='number'
                sx={{ flex: 1 }}
                label='Amount'
                error={!!errors?.[`issueTagTokenAmounts.${index}.amount`]}
                helperText={errors?.[`issueTagTokenAmounts.${index}.amount`]?.message as string}
                size='small'
              />
            )}
          />
          <IconButton onClick={() => remove(index)} size='small' color='error'>
            <DeleteIcon fontSize='small' />
          </IconButton>
        </Box>
      ))}
    </Stack>
  );
}
