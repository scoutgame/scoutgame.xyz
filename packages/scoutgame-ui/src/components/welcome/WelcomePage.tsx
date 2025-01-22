import { type SessionUser } from '@packages/nextjs/session/interfaces';

import { SinglePageLayout } from '../common/Layout';
import { SinglePageWrapper } from '../common/SinglePageWrapper';

import { ExtraDetailsForm } from './builder/components/ExtraDetailsForm';

export function WelcomePage({ user }: { user: SessionUser }) {
  return (
    <SinglePageLayout>
      <SinglePageWrapper bgcolor='background.default'>
        <ExtraDetailsForm user={user} />
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
