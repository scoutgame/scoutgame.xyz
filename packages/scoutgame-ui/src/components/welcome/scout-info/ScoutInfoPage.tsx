import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { SinglePageLayout } from '../../common/Layout';
import { SinglePageWrapper } from '../../common/SinglePageWrapper';
import { InfoBackgroundImage } from '../../layout/InfoBackgroundImage';

import { ScoutInfoContent } from './ScoutInfoContent';

export function ScoutInfoPage({ builder, dailyAverageGems }: { dailyAverageGems: number; builder: BuilderInfo }) {
  return (
    <SinglePageLayout>
      <InfoBackgroundImage />
      <SinglePageWrapper bgcolor='background.default' maxWidth='350px' height='initial'>
        <ScoutInfoContent builder={builder} dailyAverageGems={dailyAverageGems} />
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
