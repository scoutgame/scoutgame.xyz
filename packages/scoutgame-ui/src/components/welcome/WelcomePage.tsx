import { type SessionUser } from '@packages/scoutgame/session/interfaces';

import { SinglePageLayout } from '../common/Layout';
import { SinglePageWrapper } from '../common/SinglePageWrapper';
import { InfoBackgroundImage } from '../layout/InfoBackgroundImage';

import { ExtraDetailsForm } from './builder/components/ExtraDetailsForm';

export function WelcomePage({ user }: { user: SessionUser }) {
  return (
    <SinglePageLayout>
      <InfoBackgroundImage />
      <SinglePageWrapper bgcolor='background.default'>
        <ExtraDetailsForm user={user} />
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
