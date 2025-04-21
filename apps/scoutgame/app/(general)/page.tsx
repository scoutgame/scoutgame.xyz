import { isDraftSeason } from '@packages/dates/utils';
import type { Metadata } from 'next';

import { DraftLandingPage } from '../../components/home/DraftLandingPage';
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

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Scout Game',
    openGraph: {
      title: 'Scout Game - Onchain developer network',
      description: 'Fantasy sports with onchain developers'
    },
    other: {
      'fc:frame': JSON.stringify(frame)
    }
  };
}

export default async function Home() {
  const draftSeason = isDraftSeason();
  return draftSeason ? <DraftLandingPage /> : <LandingPage />;
}
