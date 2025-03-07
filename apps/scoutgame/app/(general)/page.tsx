import type { Metadata } from 'next';

import { LandingPage } from '../../components/home/LandingPage';

const frame = {
  version: 'next',
  imageUrl: `https://6531-45-125-222-48.ngrok-free.app/images/farcaster/fc_frame.png`,
  button: {
    title: 'Scout',
    action: {
      type: 'launch_frame',
      name: 'Scout Game Test',
      url: `https://6531-45-125-222-48.ngrok-free.app`,
      splashImageUrl: `https://6531-45-125-222-48.ngrok-free.app/images/farcaster/fc_splash.png`,
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
