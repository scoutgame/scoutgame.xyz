import type { Metadata } from 'next';

import { LandingPage } from '../../components/home/LandingPage';

const frame = {
  version: 'next',
  imageUrl: `https://rnlxh-103-120-203-106.a.free.pinggy.link/favicon.ico`,
  button: {
    title: 'Scout',
    action: {
      type: 'launch_frame',
      name: 'Farcaster Frames v2 Demo',
      url: 'https://rnlxh-103-120-203-106.a.free.pinggy.link',
      splashImageUrl: `https://rnlxh-103-120-203-106.a.free.pinggy.link/images/scout-game-logo-square.png`,
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
  return <LandingPage />;
}
