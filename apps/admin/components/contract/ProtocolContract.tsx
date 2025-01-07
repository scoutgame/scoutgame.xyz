import 'server-only';

import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';

import { aggregateProtocolData } from 'lib/contract/aggregateProtocolData';

import { ProtocolContractView } from './ProtocolContractView';

export async function ProtocolContract() {
  const user = await getUserFromSession();
  const protocolData = await aggregateProtocolData({ userId: user?.id });

  return <ProtocolContractView {...protocolData} />;
}
