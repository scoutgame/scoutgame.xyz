import type { BoxProps } from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';

import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

import { SettingsContent } from './SettingsContent';

export function SpaceSettingsDialog() {
  const isMobile = useSmallScreen();
  const { activePath, onClose, openSettings, isOpen, unsavedChanges } = useSettingsDialog();
  const confirmExitPopupState = usePopupState({ variant: 'popover', popupId: 'confirm-exit' });

  const handleClose = (e: any) => {
    if (unsavedChanges) {
      confirmExitPopupState.open(e);
    } else {
      onClose();
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth='lg'
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          maxHeight: 800,
          height: { md: '90vh' },
          background: (theme) =>
            theme.palette.mode === 'dark' ? 'var(--background-dark)' : 'var(--background-default)',
          borderRadius: (theme) => theme.spacing(1)
        }
      }}
      onClose={handleClose}
      open={isOpen}
    >
      <SettingsContent activePath={activePath} onClose={handleClose} onSelectPath={openSettings} />
      <ConfirmDeleteModal
        onClose={confirmExitPopupState.close}
        title='Unsaved changes'
        open={confirmExitPopupState.isOpen}
        buttonText='Discard'
        secondaryButtonText='Cancel'
        question='Are you sure you want to close this window? You have unsaved changes.'
        onConfirm={() => {
          confirmExitPopupState.close();
          onClose();
        }}
      />
    </Dialog>
  );
}
