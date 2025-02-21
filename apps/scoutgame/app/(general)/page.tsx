import { baseUrl } from '@packages/utils/constants';
import type { Metadata } from 'next';

import { LandingPage } from '../../components/home/LandingPage';

const frame = {
  version: 'next',
  imageUrl: `https://${baseUrl}/images/scout-game-logo-square.png`,
  button: {
    title: 'Scout',
    action: {
      type: 'launch_frame',
      name: 'Scout Game',
      url: `https://${baseUrl}`,
      splashImageUrl: `https://${baseUrl}/images/scout-game-logo-square.png`,
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
