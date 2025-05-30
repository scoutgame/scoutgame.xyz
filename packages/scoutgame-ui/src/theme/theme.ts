'use client';

import './interfaces';

import { createTheme, alpha, darken, lighten, responsiveFontSizes } from '@mui/material/styles';
import { Inter } from 'next/font/google';

import {
  backgroundColorDarkMode,
  backgroundLightColorDarkMode,
  brandColor,
  disabledTextColorDarkMode,
  inputBackgroundDarkMode,
  inputBorderDarkMode,
  primaryTextColorDarkMode,
  purpleDisabled,
  secondaryText,
  secondaryLightText,
  blackText,
  secondaryDarkText
} from './colors';

const interFont = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const themeOptions: Parameters<typeof createTheme>[0] = {
  typography: {
    fontFamily: interFont.style.fontFamily,
    button: {
      fontWeight: 600,
      fontSize: '1rem'
    }
  },
  shape: {
    borderRadius: 5
  },
  breakpoints: {
    xsm: 360
  },
  cssVariables: true,
  defaultColorScheme: 'dark',
  colorSchemes: {
    dark: {
      // palette for dark mode
      palette: {
        background: {
          default: backgroundColorDarkMode,
          paper: backgroundLightColorDarkMode,
          dark: darken(backgroundLightColorDarkMode, 0.25),
          light: lighten(backgroundColorDarkMode, 0.125) // this # is based on the background needed for Info pages
        },
        text: {
          primary: primaryTextColorDarkMode,
          secondary: secondaryText,
          disabled: disabledTextColorDarkMode
        },
        primary: {
          main: brandColor,
          dark: purpleDisabled
        },
        secondary: {
          main: secondaryText,
          light: secondaryLightText,
          dark: secondaryDarkText
        },
        inputBackground: {
          main: inputBackgroundDarkMode
        },
        black: {
          main: blackText,
          dark: '#000'
        },
        orange: {
          main: '#FFAC81',
          dark: '#FF5154'
        },
        green: {
          main: '#85FF9E'
        },
        yellow: {
          main: '#fcff6c'
        },
        pink: {
          main: '#FF66C5'
        },
        blue: {
          main: '#045BCA',
          dark: '#034497'
        }
      }
    }
  },
  components: {
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16 // Adjust this value to increase or decrease the roundness
        }
      }
    },
    MuiPopover: {
      defaultProps: {
        disableRestoreFocus: true
      }
    },
    MuiFormLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.primary,
          marginBottom: 5
        })
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState?.variant === 'rounded' && {
            borderRadius: 10
          }),
          fontWeight: 500
        })
      }
    },
    MuiAutocomplete: {
      defaultProps: {
        blurOnSelect: 'touch'
      },
      styleOverrides: {
        popper: {
          zIndex: '1050'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.default,
          boxShadow: 'none',
          paddingTop: 1,
          paddingBottom: 1
        })
      }
    },
    MuiPaper: {
      styleOverrides: {
        // Disable the lightening of the background when elevation is applied
        // source: https://mui.com/material-ui/react-paper/
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true
      }
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: brandColor
        }
      }
    },
    MuiButtonGroup: {
      defaultProps: {
        disableRipple: true,
        disableElevation: true
      },
      styleOverrides: {
        groupedContained: {
          '&:not(:last-child)': {
            borderRightColor: 'rgba(0, 0, 0 / 0.2)'
          }
        }
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: 'transparent',
          borderRadius: '5px',
          paddingTop: 2,
          paddingBottom: 2,
          paddingRight: 2,
          paddingLeft: 2,
          fontWeight: '600',
          color: theme.palette.secondary.main,
          borderStyle: 'solid',
          borderWidth: '1px',
          borderColor: theme.palette.secondary.main,
          '&.Mui-selected': {
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.black.main
          },
          '&:hover': {
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.black.main
          }
        })
      }
    },
    MuiButton: {
      defaultProps: {
        variant: 'contained',
        disableElevation: true
      },
      variants: [
        {
          props: { variant: 'gradient' },
          style: ({ theme }) => ({
            background: `linear-gradient(90deg, #69DDFF 0%,${brandColor} 100%)`,
            borderRadius: '20px',
            paddingTop: 2,
            paddingBottom: 2,
            paddingRight: 1,
            paddingLeft: 1,
            fontSize: '0.9rem',
            fontWeight: '500',
            color: theme.palette.black.main
          })
        },
        {
          props: { variant: 'blue' },
          style: ({ theme }) => ({
            background: 'transparent',
            borderRadius: theme.spacing(1),
            paddingTop: theme.spacing(1),
            paddingBottom: theme.spacing(1),
            paddingRight: theme.spacing(1),
            paddingLeft: theme.spacing(1),
            backgroundColor: theme.palette.blue.main,
            '&:hover': {
              backgroundColor: theme.palette.blue.dark,
              transition: 'background-color 0.15s ease-in-out'
            }
          })
        },
        {
          props: { variant: 'buy' },
          style: ({ theme }) => ({
            background: 'transparent',
            borderRadius: '5px',
            paddingTop: 2,
            paddingBottom: 2,
            paddingRight: 2,
            paddingLeft: 2,
            // fontSize: '0.9rem',
            color: theme.palette.secondary.main,
            borderStyle: 'solid',
            borderWidth: '1px',
            borderColor: theme.palette.secondary.main,
            '&:hover': {
              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
              transition: 'background-color 0.3s ease-in-out'
            }
          })
        },
        {
          props: { variant: 'buy', disabled: true },
          style: ({ theme }) => ({
            borderColor: 'grey'
          })
        },
        {
          props: { variant: 'buy-starter' },
          style: ({ theme }) => ({
            background: 'transparent',
            borderRadius: '5px',
            paddingTop: 2,
            paddingBottom: 2,
            paddingRight: 2,
            paddingLeft: 2,
            // fontSize: '0.9rem',
            color: theme.palette.green.main,
            borderStyle: 'solid',
            borderWidth: '1px',
            borderColor: theme.palette.green.main,
            '&:hover': {
              backgroundColor: alpha(theme.palette.green.main, 0.1),
              transition: 'background-color 0.3s ease-in-out'
            }
          })
        }
      ],
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '1rem',
          textTransform: 'none',
          paddingTop: 3,
          paddingBottom: 3
        }
      }
    },
    MuiIconButton: {
      defaultProps: {
        disableRipple: true
      }
    },
    MuiMenuItem: {
      defaultProps: {
        dense: true
      }
    },
    MuiTypography: {
      defaultProps: {
        color: 'text.primary'
      }
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
        enterDelay: 1000,
        placement: 'top'
      }
    },
    MuiCard: {
      defaultProps: {
        variant: 'outlined'
      },
      styleOverrides: {
        root: ({ theme }) => ({
          boxShadow: 'none'
        })
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          '&:last-child': {
            paddingBottom: 16
          }
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          // this makes the text look lighter
          MozOsxFontSmoothing: 'none'
        }
      }
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          fontSize: 'inherit',
          minWidth: '30px !important'
        }
      }
    },
    MuiInput: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          transform: 'scale(1, 1)'
        }
      }
    },
    MuiOutlinedInput: {
      defaultProps: {
        size: 'small'
      },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: inputBackgroundDarkMode,
          ...theme.applyStyles('dark', {
            '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
              borderColor: inputBorderDarkMode
            }
          })
        }),
        notchedOutline: ({ theme }) => ({
          ...theme.applyStyles('dark', {
            borderColor: inputBorderDarkMode
          })
        })
      }
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginLeft: 0
        }
      }
    },
    MuiSelect: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiTabs: {
      defaultProps: {
        TabIndicatorProps: {
          sx: (theme) => ({
            backgroundColor: theme.palette.text.secondary
          })
        }
      },
      styleOverrides: {
        root: {}
      }
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          minHeight: 0,
          textTransform: 'none',
          color: theme.palette.text.primary,
          fontWeight: '400',
          '&.Mui-selected': {
            color: theme.palette.text.secondary
          }
        })
      }
    },
    MuiLink: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.primary.main,
          '&:hover': {
            color: theme.palette.primary.main,
            textDecoration: 'underline'
          },
          fontFamily: interFont.style.fontFamily
        })
      },
      defaultProps: {
        underline: 'none'
      }
    }
  }
};

const createdTheme = createTheme(themeOptions);

export default responsiveFontSizes(createdTheme) as typeof createdTheme;
