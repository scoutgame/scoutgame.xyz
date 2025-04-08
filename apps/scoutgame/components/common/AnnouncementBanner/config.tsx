import { Link } from '@mui/material';

export const BANNERS_COOKIE_KEY = 'last_seen_banner';

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
  },
  dev_token_announcement: {
    title: 'Updated Friendly Quest',
    expiration: '2025-04-21',
    description: (
      <>
        Scout Game’s{' '}
        <Link
          sx={{ textDecoration: 'underline', fontWeight: 'bold', color: 'inherit', '&:hover': { color: 'inherit' } }}
          href='https://scoutgame.substack.com/p/whats-next-for-the-scout-game-airdrops'
          target='_blank'
        >
          DEV token
        </Link>{' '}
        launches April 21
      </>
    )
  }
};

const now = new Date().toISOString();
export const currentBanner = Object.entries(banners).find(([_, banner]) => banner.expiration > now);
