import type { Metadata } from 'next';

import { DevTokensPage } from 'components/info/pages/DevTokensPage';

export const metadata: Metadata = {
  title: 'DEV Tokens'
};

export default async function DevTokens() {
  return <DevTokensPage />;
}
