import { SinglePageLayout } from '../../common/Layout';
import { SinglePageWrapper } from '../../common/SinglePageWrapper';

import { HowItWorksContainer } from './HowItWorkscontainer';

export function HowItWorksPage() {
  return (
    <SinglePageLayout data-test='how-it-works-page'>
      <SinglePageWrapper bgcolor='background.default' height='initial'>
        <HowItWorksContainer />
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
