import type { ProposalCategory } from '@charmverse/core/prisma';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

interface ProposalDialogContext {
  newProposal?: { category: ProposalCategory | null };
  onClose?: () => void;
}

interface Context {
  props: ProposalDialogContext;
  createProposal: (newProposal: ProposalDialogContext['newProposal']) => void;
  hideProposal: () => void;
  showProposal: (context: ProposalDialogContext) => void;
}

const ContextElement = createContext<Readonly<Context>>({
  props: {},
  createProposal: () => {},
  hideProposal: () => {},
  showProposal: () => {}
});

export const useProposalDialog = () => useContext(ContextElement);

export function ProposalDialogProvider({ children }: { children: ReactNode }) {
  const [props, setProps] = useState<ProposalDialogContext>({});

  function hideProposal() {
    props?.onClose?.();
    setProps({});
  }

  function showProposal(_context: ProposalDialogContext) {
    setProps(_context);
  }

  function createProposal(newProposal: ProposalDialogContext['newProposal']) {
    setProps({ newProposal });
  }

  const value = useMemo(
    () => ({
      props,
      createProposal,
      hideProposal,
      showProposal
    }),
    [props]
  );

  return <ContextElement.Provider value={value}>{children}</ContextElement.Provider>;
}
