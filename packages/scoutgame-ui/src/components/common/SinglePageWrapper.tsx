import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';

export function SinglePageWrapper({ children, hasBorder, ...props }: BoxProps & { hasBorder?: boolean }) {
  const border = hasBorder
    ? {
        sx: {
          borderWidth: { xs: 0, sm: 1 },
          borderStyle: { xs: 'none', sm: 'solid' },
          borderColor: { xs: 'transparent', sm: 'secondary.main' }
        }
      }
    : undefined;
  return (
    <Box
      position='relative'
      borderRadius={{ xs: 0, md: 2 }}
      maxWidth='500px'
      height='100%'
      textAlign='left'
      mx='auto'
      p={{ xs: 2, md: 3 }}
      {...border}
      {...props}
    >
      {children}
    </Box>
  );
}
