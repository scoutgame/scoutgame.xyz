import type { TypographyProps } from '@mui/material';
import { Typography } from '@mui/material';

export function TableCellText({
  deskTopfontSize = '14px',
  ...props
}: {
  children: React.ReactNode;
  deskTopfontSize?: string;
} & TypographyProps) {
  return <Typography noWrap fontSize={{ xs: '12px', md: deskTopfontSize }} {...props} />;
}
