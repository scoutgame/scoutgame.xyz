// 'use client';

import { Link } from '@mui/material';
import { cookies } from 'next/headers';

import { AnnouncementBannerAlert } from './Alert';

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

// Server component to get cookies during server rendering
function getServerCookies() {
  try {
    // This will only work in a server component or route handler
    const cookieStore = cookies();
    return cookieStore.get(BANNERS_COOKIE_KEY)?.value;
  } catch (error) {
    // If called in client context, return undefined
    return undefined;
  }
}

export function AnnouncementBanner() {
  const lastSeenBanner = getServerCookies();

  if (
    // no current banner
    !currentBanner ||
    // seen by user already
    lastSeenBanner === currentBanner[0]
  ) {
    return null;
  }

  return <AnnouncementBannerAlert id={currentBanner[0]} message={currentBanner[1].description} />;
}
