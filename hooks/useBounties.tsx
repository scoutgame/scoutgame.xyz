import { Bounty } from '@prisma/client';
import charmClient, { PopulatedBounty } from 'charmClient';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import { BountyWithDetails } from '../models';
import { useCurrentSpace } from './useCurrentSpace';

type IContext = {
  bounties: PopulatedBounty[],
  setBounties: Dispatch<SetStateAction<PopulatedBounty[]>>,
  currentBountyId: string | null,
  updateCurrentBountyId: (bountyId: string | null) => void,
  currentBounty: BountyWithDetails | null
  updateBounty: (bountyId: string, update: Partial<Bounty>) => Promise<BountyWithDetails>
  deleteBounty: (bountyId: string) => Promise<true>
  refreshBounty: (bountyId: string) => void
};

export const BountiesContext = createContext<Readonly<IContext>>({
  bounties: [],
  setBounties: () => undefined,
  currentBountyId: null,
  updateCurrentBountyId: () => undefined,
  currentBounty: null,
  updateBounty: () => Promise.resolve({} as any),
  deleteBounty: () => Promise.resolve(true),
  refreshBounty: () => undefined
});

export function BountiesProvider ({ children }: { children: ReactNode }) {
  const [space] = useCurrentSpace();
  const [bounties, setBounties] = useState<PopulatedBounty[]>([]);
  useEffect(() => {
    if (space) {
      setBounties([]);
      charmClient.listBounties(space.id)
        .then(_bounties => {
          setBounties(_bounties);
        });
    }
  }, [space?.id]);

  const [currentBountyId, setCurrentBountyId] = useState<string | null>(null);

  const [currentBounty, setCurrentBounty] = useState<BountyWithDetails | null>(null);

  // Updates the value of a bounty in the bounty list
  function refreshBountyList (bounty: BountyWithDetails) {
    const bountyIndex = bounties.findIndex(bountyInList => bountyInList.id === bounty.id);

    const updatedList = bounties.slice();

    if (bountyIndex > -1) {
      updatedList[bountyIndex] = bounty;
    }
    else {
      updatedList.push(bounty);
    }

    setBounties(updatedList);
  }

  async function updateBounty (bountyId: string, bountyUpdate: Partial<Bounty>) {

    const updatedBounty = await charmClient.updateBounty(bountyId, bountyUpdate);

    refreshBountyList(updatedBounty);

    if (currentBounty?.id === updatedBounty.id) {
      setCurrentBounty(updatedBounty);
    }

    return updatedBounty;
  }

  async function updateCurrentBountyId (id: string | null) {
    setCurrentBountyId(id);

    if (id) {
      const refreshed = await charmClient.getBounty(id);
      refreshBountyList(refreshed);
      setCurrentBounty(refreshed);
    }
    else {
      setCurrentBounty(null);
    }
  }

  async function deleteBounty (bountyId: string): Promise<true> {
    await charmClient.deleteBounty(bountyId);
    setBounties(bounties.filter(bounty => bounty.id !== bountyId));
    if (currentBounty?.id === bountyId) {
      setCurrentBounty(null);
    }
    return true;
  }

  async function refreshBounty (bountyId: string) {
    const refreshed = await charmClient.getBounty(bountyId);
    if (currentBounty?.id === bountyId) {
      setCurrentBounty(refreshed);
    }
    refreshBountyList(refreshed);
  }

  const value = useMemo(() => ({
    bounties,
    setBounties,
    currentBountyId,
    updateCurrentBountyId,
    currentBounty,
    updateBounty,
    deleteBounty,
    refreshBounty
  }), [bounties, currentBountyId, currentBounty]);

  return (
    <BountiesContext.Provider value={value}>
      {children}
    </BountiesContext.Provider>
  );
}

export const useBounties = () => useContext(BountiesContext);
