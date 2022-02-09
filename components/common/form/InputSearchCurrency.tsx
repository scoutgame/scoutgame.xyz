import { Autocomplete, Box, TextField } from '@mui/material';
import Image from 'next/image';
import { FiatCurrencyList, FiatCurrency } from '../../../models/Currency';

const currencyOptions = Object.keys(FiatCurrencyList);

export function InputSearchCurrency ({ callback }: {callback: (value: FiatCurrency) => any}) {

  function emitValue (value: string) {
    if (currencyOptions.indexOf(value) >= 0) {
      callback(value as FiatCurrency);
    }
  }

  return (
    <Autocomplete
      onChange={(event, value) => {
        if (value !== null) {
          emitValue(value as any);
        }
      }}
      id='currency'
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

