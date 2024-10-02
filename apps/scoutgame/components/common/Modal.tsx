import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import type { SxProps, Theme } from '@mui/material';
import { Box, IconButton, Typography } from '@mui/material';
import type { ModalProps } from '@mui/material/Modal';
import MuiModal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';
import type { ReactNode } from 'react';

const defaultSx: SxProps<Theme> = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 500,
  bgcolor: 'background.paper',
  p: 4,
  border: 0,
  borderRadius: 3,
  overflowY: 'auto',
  maxHeight: '95svh'
};

export function BasicModal({
  children,
  theme = 'light',
  sx = {},
  title,
  ...props
}: Omit<ModalProps, 'children' | 'onClose'> & {
  theme?: 'light' | 'dark' | 'system';
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <MuiModal data-mui-color-scheme={theme} {...props}>
      <Paper sx={{ ...defaultSx, ...(sx as any) }}>
        {title && (
          <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6' color='secondary'>
              {title}
            </Typography>
            {props.onClose && (
              <IconButton data-test='close-modal' onClick={props.onClose} sx={{ p: 0 }}>
                <HighlightOffIcon color='primary' />
              </IconButton>
            )}
          </Box>
        )}
        {children}
      </Paper>
    </MuiModal>
  );
}
