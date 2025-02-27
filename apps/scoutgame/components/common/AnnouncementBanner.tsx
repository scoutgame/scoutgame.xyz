'use client';

import { Clear as ClearIcon } from '@mui/icons-material';
import { Alert, AlertTitle, IconButton, Link } from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

const HIDDEN_BANNERS_KEY = 'hidden_banners';

type Banner = {
  title: string;
  expiration: string;
  description: string | React.ReactNode;
};

const banners: Record<string, Banner> = {
  updated_referral_bonus: {
    title: 'Updated Friendly Quest',
    expiration: '2025-03-01',
    description: (
      <>
        New friendly quest: +5 OP for you and every player who signs up with{' '}
        <Link
          sx={{ textDecoration: 'underline', fontWeight: 'bold', color: 'inherit', '&:hover': { color: 'inherit' } }}
          href='/quests'
        >
          your link
        </Link>
      </>
    )
  }
};

type HiddenBanners = Record<string, boolean>;

export function AnnouncementBanner() {
  const [hiddenBanners, setHiddenBanners] = useLocalStorage<HiddenBanners>(HIDDEN_BANNERS_KEY, {});

  const handleClose = (bannerId: string) => {
    // Store banner as hidden in localStorage
    setHiddenBanners({ ...hiddenBanners, [bannerId]: true });
  };

  const currentBanner = Object.values(banners).find((banner) => banner.expiration > new Date().toISOString());

  if (!currentBanner) {
    return null;
  }

  // seen by user already
  if (hiddenBanners[currentBanner.id]) {
    return null;
  }

  return (
    <Alert
      severity='info'
      variant='filled'
      onClose={() => handleClose(currentBanner.id)}
      sx={{
        borderRadius: 0,
        justifyContent: 'center',
        '& .MuiAlert-message': {
          fontSize: '1rem'
        }
      }}
    >
      {/* <AlertTitle>{currentBanner.title}</AlertTitle> */}
      {currentBanner.description}
    </Alert>
  );
}
