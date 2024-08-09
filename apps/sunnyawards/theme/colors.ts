import { darken, lighten } from '@mui/material/styles';

export const blueColor = '#009Fb7';
export const darkBlueColor = darken(blueColor, 0.1);
export const footerBackground = '#030230';

// light mode
export const primaryTextColor = '#37352f';
export const secondaryTextColor = '#888';
export const backgroundColor = '#fff';
export const lightGreyColor = '#edf2f4';
export const backgroundLightColor = lightGreyColor;
export const backgroundDarkColor = darken(backgroundColor, 0.1);
export const settingsHeaderBackgroundColor = lighten(backgroundLightColor, 0.4);
export const scrollBarTrackBackgroundColor = darken(backgroundLightColor, 0.1);
export const scrollBarThumbBackgroundColor = lighten(scrollBarTrackBackgroundColor, 0.5);
export const inputBackground = 'rgb(245, 246, 247)';
export const inputBorder = 'rgba(15, 15, 15, 0.1)';
export const linkUnderlineColor = 'rgba(55,53,47,0.25)';

// dark mode
export const primaryTextColorDarkMode = '#ededed';
export const secondaryTextColorDarkMode = '#999';
export const backgroundColorDarkMode = '#191919';
export const backgroundLightColorDarkMode = '#16234f';
export const backgroundDarkColorDarkMode = '#171717';
export const settingsHeaderBackgroundColorDarkMode = darken(backgroundLightColorDarkMode, 0.3);
export const scrollBarTrackBackgroundColorDarkMode = darken(backgroundLightColorDarkMode, 0.2);
export const scrollBarThumbBackgroundColorDarkMode = lighten(scrollBarTrackBackgroundColorDarkMode, 0.1);
export const inputBackgroundDarkMode = 'rgba(255, 255, 255, 0.055)';
export const inputBorderDarkMode = 'rgba(255, 255, 255, 0.055)';
export const linkUnderlineColorDarkMode = 'rgba(55, 55, 55, 1)';

// Farcaster specific
export const farcasterBrandColor = '#8465CB';
export const farcasterBrandColorLight = lighten(farcasterBrandColor, 0.9);
export const farcasterBrandColorDark = '#6944ba';

// The sunnys specific
export const sunnysColor = '#d8be7d';
export const sunnysColorLight = '#f8e8c1';
