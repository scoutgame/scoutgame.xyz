import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { IconButton, Dialog as MuiDialog, DialogContent, DialogTitle } from '@mui/material';
import type { DialogProps } from '@mui/material/Dialog';
import type { ReactNode } from 'react';

// based on MUI Dialog, reduces some boilerplate
export function Dialog({
  children,
  title,
  ...props
}: Omit<DialogProps, 'children' | 'onClose' | 'title'> & {
  children: ReactNode;
  onClose?: () => void;
  title?: string | ReactNode;
}) {
  return (
    <MuiDialog {...props}>
      {title && <DialogTitle color='secondary'>{title}</DialogTitle>}
      {props.onClose && <CloseButton onClick={props.onClose} />}
      <DialogContent sx={{ pt: 0 }}>{children}</DialogContent>
    </MuiDialog>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton
      data-test='close-modal'
      aria-label='close'
      onClick={onClick}
      sx={{
        zIndex: 1, // necessary for iOS for some reason
        position: 'absolute',
        right: 8,
        top: 8
      }}
    >
      <HighlightOffIcon color='primary' />
    </IconButton>
  );
}
