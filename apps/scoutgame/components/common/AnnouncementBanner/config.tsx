import { Link } from '@mui/material';

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
export const currentBanner = Object.entries(banners).find(([_, banner]) => banner.expiration > now);
