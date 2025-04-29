import type { Metadata } from 'next';

import { DevTokensPage } from 'components/info/pages/DevTokensPage';

export const metadata: Metadata = {
  title: 'Scout Protocol Token'
};

export default async function DevTokens() {
  return <DevTokensPage />;
}
