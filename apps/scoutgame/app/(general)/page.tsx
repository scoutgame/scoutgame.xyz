import type { Metadata } from 'next';

import { LandingPage } from '../../components/home/LandingPage';

const frame = {
  version: 'next',
  imageUrl: `https://scoutgame.xyz/images/farcaster/fc_frame.png`,
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
  return <LandingPage />;
}
