import { SinglePageLayout } from '../../common/Layout';
import { SinglePageWrapper } from '../../common/SinglePageWrapper';
import { InfoBackgroundImage } from '../../layout/InfoBackgroundImage';

import { HowItWorksContent } from './HowItWorksContent';

export function HowItWorksPage() {
  return (
    <SinglePageLayout>
      <InfoBackgroundImage />
      <SinglePageWrapper bgcolor='background.default' height='initial'>
        <HowItWorksContent />
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
