import { CeloLandingPage } from '@packages/scoutgame-ui/components/partners/CeloLandingPage';
import { Game7LandingPage } from '@packages/scoutgame-ui/components/partners/Game7LandingPage';
import { LitLandingPage } from '@packages/scoutgame-ui/components/partners/LitLandingPage';
import { TalentLandingPage } from '@packages/scoutgame-ui/components/partners/TalentLandingPage';

import { LandingPage } from 'components/home/LandingPage';

export default async function Home({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const partner = searchParams.partner as string;

  if (partner === 'celo') {
    return <CeloLandingPage />;
  } else if (partner === 'talent') {
    return <TalentLandingPage />;
  } else if (partner === 'game7') {
    return <Game7LandingPage />;
  } else if (partner === 'lit') {
    return <LitLandingPage />;
  }

  return <LandingPage />;
}
