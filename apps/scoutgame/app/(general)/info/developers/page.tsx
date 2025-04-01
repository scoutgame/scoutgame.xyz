import type { Metadata } from 'next';

import { DevelopersPage } from 'components/info/pages/DevelopersPage';

export const metadata: Metadata = {
  title: 'Developers'
};

export default async function Developers() {
  return <DevelopersPage />;
}
