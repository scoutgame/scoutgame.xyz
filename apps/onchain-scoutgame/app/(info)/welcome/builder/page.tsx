import { BuilderPage } from '@packages/scoutgame-ui/components/welcome/builder/BuilderWelcomePage';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Welcome'
};

export default async function AskAreYouABuilder() {
  return <BuilderPage />;
}
