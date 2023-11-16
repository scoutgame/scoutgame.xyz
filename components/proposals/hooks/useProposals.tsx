import type { ProposalWithUsers } from '@charmverse/core/proposals';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { useGetProposalsBySpace } from 'charmClient/hooks/proposals';
import type { ProposalStatusFilter } from 'components/proposals/components/ProposalViewOptions/ProposalsViewOptions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import type { ArchiveProposalRequest } from 'lib/proposal/archiveProposal';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';

type ProposalsContextType = {
  proposals: ProposalWithUsers[] | undefined;
  mutateProposals: KeyedMutator<ProposalWithUsers[]>;
  isLoading: boolean;
  archiveProposal: (input: ArchiveProposalRequest) => Promise<void>;
  updateProposal: (proposal: UpdateProposalRequest) => Promise<void>;
  refreshProposal: (proposalId: string) => Promise<void>;
};

export const ProposalsContext = createContext<Readonly<ProposalsContextType>>({
  proposals: undefined,
  mutateProposals: async () => {
    return undefined;
  },
  isLoading: false,
  archiveProposal: () => Promise.resolve(),
  updateProposal: () => Promise.resolve(),
  refreshProposal: () => Promise.resolve()
});

export function ProposalsProvider({ children }: { children: ReactNode }) {
  const { loadingPages } = usePages();
  const { space } = useCurrentSpace();

  const { data: proposals, mutate: mutateProposals, isLoading } = useGetProposalsBySpace({ spaceId: space?.id });

  const archiveProposal = useCallback(
    async (input: ArchiveProposalRequest) => {
      if (space) {
        const proposal = await charmClient.proposals.archiveProposal(input);
        mutateProposals((oldProposals) => {
          const proposalList = oldProposals ?? [];
          const existingProposalIndex = proposalList.findIndex((p) => p.id === proposal.id);
          if (existingProposalIndex < 0) {
            proposalList.push(proposal);
          } else {
            proposalList[existingProposalIndex] = proposal;
          }
          return proposalList;
        });
      }
    },
    [mutateProposals, space]
  );

  const updateProposal = useCallback(
    async (proposal: UpdateProposalRequest) => {
      if (proposal) {
        await charmClient.proposals.updateProposal(proposal);

        mutateProposals();
      }
    },
    [mutateProposals]
  );

  const refreshProposal = useCallback(
    async (proposalId: string) => {
      const proposal = await charmClient.proposals.getProposal(proposalId);
      mutateProposals((data) => {
        const proposalList = data ?? [];
        const proposalIndex = proposalList.findIndex((p) => p.id === proposalId);

        if (proposalIndex >= 0) {
          const existingProposal = proposalList[proposalIndex];
          proposalList[proposalIndex] = {
            ...existingProposal,
            ...proposal
          };
        } else {
          proposalList.push(proposal);
        }
        return proposalList;
      });
    },
    [mutateProposals]
  );

  const value = useMemo(
    () => ({
      proposals,
      mutateProposals,
      isLoading: isLoading || loadingPages,
      archiveProposal,
      updateProposal,
      refreshProposal
    }),
    [archiveProposal, isLoading, loadingPages, mutateProposals, proposals, updateProposal, refreshProposal]
  );

  return <ProposalsContext.Provider value={value}>{children}</ProposalsContext.Provider>;
}

export const useProposals = () => useContext(ProposalsContext);
