'use client';

import { Alert } from '@mui/material';
import { setCookie } from '@packages/utils/browser';
import { useState } from 'react';

import { BANNERS_COOKIE_KEY } from '../config';

export function AnnouncementBannerAlert({ id, message }: { id: string; message: string | React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(!!message);

  const handleClose = (bannerId: string) => {
    // Store banner as hidden in cookie
    setCookie({
      name: BANNERS_COOKIE_KEY,
      value: bannerId
    });
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Alert
      severity='info'
      variant='filled'
      onClose={() => handleClose(id)}
      sx={{
        borderRadius: 0,
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1, // ensure this appears background image on landing page
        '& .MuiAlert-message': {
          fontSize: '1rem',
          textAlign: 'center',
          width: '100%'
        }
      }}
    >
      {/* <AlertTitle>{currentBanner.title}</AlertTitle> */}
      {message}
    </Alert>
  );
}
