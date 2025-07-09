import type { Metadata } from 'next';

import { SeasonOneLandingPage } from '../../components/home/SeasonOneLandingPage';

export const frame = {
  version: 'next',
  name: 'Scout Game',
  imageUrl: `https://scoutgame.xyz/images/farcaster/fc_frame.png`,
  homeUrl: `https://scoutgame.xyz`,
  iconUrl: 'https://scoutgame.xyz/images/farcaster/fc_icon.png',
  description: 'Fantasy sports with onchain developers',
  ogTitle: 'Scout Game',
  ogDescription: 'Fantasy sports with onchain developers',
  ogImage: 'https://scoutgame.xyz/images/farcaster/fc_splash.png',
  button: {
    title: 'Scout',
    action: {
      type: 'launch_frame',
      name: 'Scout Game',
      url: `https://scoutgame.xyz`,
      splashImageUrl: `https://scoutgame.xyz/images/farcaster/fc_splash.png`,
      splashBackgroundColor: '#000'
    }
  }
};

export const metadata: Metadata = {
  title: 'Scout Game',
  openGraph: {
    title: 'Scout Game - Onchain developer network',
    description: 'Fantasy sports with onchain developers'
  },
  other: {
    'fc:frame': JSON.stringify(frame)
  }
};

export default async function Home() {
  return <SeasonOneLandingPage />;
}
