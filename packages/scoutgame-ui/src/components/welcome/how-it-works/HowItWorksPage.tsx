import { SinglePageLayout } from '../../common/Layout';
import { SinglePageWrapper } from '../../common/SinglePageWrapper';

import { HowItWorksContainer } from './HowItWorkscontainer';

export function HowItWorksPage() {
  return (
    <SinglePageLayout>
      <SinglePageWrapper bgcolor='background.default' height='initial'>
        <HowItWorksContainer />
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
