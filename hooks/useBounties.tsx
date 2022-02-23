import { Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import { useCurrentSpace } from './useCurrentSpace';

type IContext = {
  bounties: Bounty[],
  setBounties: Dispatch<SetStateAction<Bounty[]>>,
};

export const BountiesContext = createContext<Readonly<IContext>>({
  bounties: [],
  setBounties: () => undefined
});

export function BountiesProvider ({ children }: { children: ReactNode }) {
  const [space] = useCurrentSpace();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  useEffect(() => {
    if (space) {
      setBounties([]);
      charmClient.listBounties(space.id)
        .then(_bounties => {
          setBounties(_bounties);
        });
    }
  }, [space]);

  const value = useMemo(() => ({
    bounties,
    setBounties
  }), [bounties]);

  return (
    <BountiesContext.Provider value={value}>
      {children}
    </BountiesContext.Provider>
  );
}

export const useBounties = () => useContext(BountiesContext);
