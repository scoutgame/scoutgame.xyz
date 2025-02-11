import { BuildersPage } from '@packages/scoutgame-ui/components/info/pages/BuildersPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developers'
};

export default async function Developers() {
  return <BuildersPage />;
}
