import { Autocomplete, Box, TextField } from '@mui/material';
import Image from 'next/image';
import { FiatCurrencyList, FiatCurrency } from '../../../models/Currency';

const currencyOptions = Object.keys(FiatCurrencyList);

export function InputSearchCurrency ({ onChange }: {onChange: (value: FiatCurrency) => any}) {

  function emitValue (value: string) {
    if (value !== null && currencyOptions.indexOf(value) >= 0) {
      onChange(value as FiatCurrency);
    }
  }

  return (
    <Autocomplete
      onChange={(event, value) => {
        emitValue(value as any);
      }}
      sx={{ minWidth: 150 }}
      options={currencyOptions}
      autoHighlight
      renderOption={(props, option) => (
        <Box component='li' sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
          {option}
          {' '}
          {FiatCurrencyList[option as FiatCurrency]}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label='Choose a currency'
          inputProps={{
            ...params.inputProps
          }}
        />
      )}
    />
  );
}

