import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import FieldLabel from 'components/common/form/FieldLabel';
import AddBoxIcon from '@mui/icons-material/AddBox';
import DeleteIcon from '@mui/icons-material/Delete';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { isTruthy } from 'lib/utilities/types';

interface Props {
  onChange: (choices: string []) => void
  title?: string,
  minimumOptions?: number
}

/**
 * Generates a list of text fields
 * @param onChange
 */
export default function InputGeneratorText ({ onChange, title = 'Options', minimumOptions = 1 }: Props) {

  const [options, setOptions] = useState<Record<string, string>>({ 0: '' });

  const keys = Object.keys(options);

  const lastKey = keys[keys.length - 1];

  const hasEnoughOptions = keys.reduce((validCount, optionKey) => {
    if (isTruthy(options[optionKey])) {
      validCount += 1;
    }
    return validCount;
  }, 0) >= minimumOptions;

  function updateValue (key: string, value: string) {
    const newOptions = {
      ...options,
      [key]: value
    };
    setOptions(newOptions);
    emitValues(newOptions);
  }

  function addRow () {
    const newIndex = parseInt(lastKey) + 1;

    setOptions({
      ...options,
      [newIndex]: ''
    });
  }

  function removeRow (key: string) {
    const newOptions = { ...options };
    delete newOptions[key];
    setOptions(newOptions);
    emitValues(newOptions);
  }

  // Emit only non empty
  function emitValues (values: Record<string, string>) {
    const toEmit = Object.values(values).filter(opt => isTruthy(opt));
    onChange(toEmit);
  }

  return (
    <Grid container direction='column' xs spacing={1}>
      <Grid item>
        <FieldLabel>{title}</FieldLabel>
      </Grid>

      {
      keys.map(key => {
        return (
          <Grid key={key} item display='flex' alignItems='center'>
            <TextField
              fullWidth
              onBlur={ev => {
                const newValue = ev.target.value;
                updateValue(key, newValue);
              }}
            />
            {
              keys.length > 1 && <DeleteIcon onClick={() => removeRow(key)} sx={{ ml: 1 }} />
            }
          </Grid>
        );
      })
      }

      {
        !hasEnoughOptions && (
          <Grid item>
            <Alert severity='info'>Please at at least {minimumOptions} non empty option{minimumOptions !== 1 ? 's' : ''}</Alert>
          </Grid>
        )
      }

      <Grid item>
        <Typography display='flex' alignItems='center'>Add row <AddBoxIcon onClick={addRow} sx={{ ml: 1 }} /></Typography>
      </Grid>

    </Grid>
  );

}
