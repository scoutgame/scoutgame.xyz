'use client';

import { Alert, Link } from '@mui/material';
import { setCookie } from '@packages/utils/browser';
import { useState } from 'react';

const BANNERS_COOKIE_KEY = 'last_seen_banner';

type Banner = {
  title: string;
  expiration: string;
  description: string | React.ReactNode;
};

const banners: Record<string, Banner> = {
  updated_referral_bonus: {
    title: 'Updated Friendly Quest',
    expiration: '2025-03-09',
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

const now = new Date().toISOString();
const currentBanner = Object.entries(banners).find(([_, banner]) => banner.expiration > now);

export function AnnouncementBannerAlert({ id, message }: { id: string; message: Banner['description'] }) {
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
        '& .MuiAlert-message': {
          fontSize: '1rem'
        }
      }}
    >
      {/* <AlertTitle>{currentBanner.title}</AlertTitle> */}
      {message}
    </Alert>
  );
}
