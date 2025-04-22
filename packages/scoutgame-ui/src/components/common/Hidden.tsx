import { log } from '@charmverse/core/log';
import type { BoxProps } from '@mui/material';
import { Box } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/react';

// props based on https://mui.com/material-ui/api/hidden/
type Props = {
  mdDown?: boolean;
  mdUp?: boolean;
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'table' | 'table-cell';
} & BoxProps;

// TODO: just use class names?
export function getSXProps({ display = 'block', mdDown, mdUp, sx = {} }: Props) {
  if (mdDown) {
    return { display: { xs: 'none', md: display }, ...sx };
  }
  if (mdUp) {
    return { display: { xs: display, md: 'none' }, ...sx };
  }
  log.warn('Hidden component must have either mdDown or mdUp prop');
  return { ...sx };
}

// replace a deprecated Hidden component
export function Hidden({ children, display = 'block', sx = {}, mdDown, mdUp, ...restProps }: PropsWithChildren<Props>) {
  return (
    <Box sx={getSXProps({ display, sx, mdDown, mdUp })} {...restProps}>
      {children}
    </Box>
  );
}
