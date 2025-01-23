import { SinglePageLayout } from '../../common/Layout';
import { SinglePageWrapper } from '../../common/SinglePageWrapper';

import { HowItWorksContent } from './HowItWorksContent';

export function HowItWorksPage() {
  return (
    <SinglePageLayout>
      <SinglePageWrapper bgcolor='background.default' height='initial'>
        <HowItWorksContent />
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
