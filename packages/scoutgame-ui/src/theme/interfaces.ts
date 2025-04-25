import type { PaletteOptions as MuiPaletteOptions, Palette as MuiPalette } from '@mui/material/styles';

declare module '@mui/material/styles' {
  export interface Palette {
    inputBackground: MuiPalette['primary'];
    black: MuiPalette['primary'];
    orange: MuiPalette['primary'];
    green: MuiPalette['primary'];
    yellow: MuiPalette['primary'];
    pink: MuiPalette['primary'];
    blue: MuiPalette['primary'];
  }

  export interface PaletteOptions {
    inputBackground: MuiPaletteOptions['primary'];
    black: MuiPaletteOptions['primary'];
    orange: MuiPaletteOptions['primary'];
    green: MuiPaletteOptions['primary'];
    yellow: MuiPaletteOptions['primary'];
    pink: MuiPaletteOptions['primary'];
    blue: MuiPaletteOptions['primary'];
  }

  export interface TypeBackground {
    default: string;
    paper: string;
    dark: string;
    light: string;
  }

  export interface BreakpointOverrides {
    xsm: true;
  }

  export interface BreakpointsOptions {
    xsm: number; // adds the `xsm` breakpoint
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    gradient: true;
    buy: true;
    'buy-starter': true;
    blue: true;
  }
}
