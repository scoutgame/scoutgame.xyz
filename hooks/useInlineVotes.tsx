import charmClient from 'charmClient';
import useTasks from 'components/nexus/hooks/useTasks';
import { ExtendedVote, VoteDTO } from 'lib/votes/interfaces';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useCurrentSpace } from './useCurrentSpace';
import { usePages } from './usePages';
import { useUser } from './useUser';

type IContext = {
  isValidating: boolean,
  inlineVotes: Record<string, ExtendedVote>
  createVote: (votePayload: Omit<VoteDTO, 'createdBy' | 'spaceId'>) => Promise<ExtendedVote>,
  castVote: (voteId: string, option: string) => Promise<void>
  deleteVote: (voteId: string) => Promise<void>,
  cancelVote: (voteId: string) => Promise<void>,
};

export const InlineVotesContext = createContext<Readonly<IContext>>({
  isValidating: true,
  inlineVotes: {},
  castVote: () => undefined as any,
  createVote: () => undefined as any,
  deleteVote: () => undefined as any,
  cancelVote: () => undefined as any
});

export function InlineVotesProvider ({ children }: { children: ReactNode }) {
  const { currentPageId } = usePages();
  const [inlineVotes, setInlineVotes] = useState<IContext['inlineVotes']>({});
  const [user] = useUser();
  const cardId = typeof window !== 'undefined' ? (new URLSearchParams(window.location.href)).get('cardId') : null;

  const { data, isValidating } = useSWR(() => currentPageId && !cardId ? `pages/${currentPageId}/inline-votes` : null, async () => charmClient.getVotesByPage(currentPageId));

  const [currentSpace] = useCurrentSpace();
  const { mutate: mutateTasks } = useTasks();

  async function castVote (voteId: string, choice: string) {
    await charmClient.castVote(voteId, choice);
    setInlineVotes((_inlineVotes) => {
      const vote = _inlineVotes[voteId];
      if (vote && user) {
        const currentChoice = vote.userChoice;
        vote.userChoice = choice;
        if (currentChoice) {
          vote.aggregatedResult[currentChoice] -= 1;
        }
        vote.aggregatedResult[choice] += 1;
        _inlineVotes[voteId] = {
          ...vote
        };

        mutateTasks((tasks) => {
          return tasks ? {
            ...tasks,
            votes: tasks.votes.filter(_vote => _vote.id !== voteId)
          } : undefined;
        }, {
          revalidate: false
        });
      }
      return { ..._inlineVotes };
    });
  }

  async function createVote (votePayload: Omit<VoteDTO, 'createdBy' | 'spaceId'>): Promise<ExtendedVote> {
    const extendedVote = await charmClient.createVote({
      ...votePayload,
      createdBy: user!.id,
      pageId: cardId ?? currentPageId,
      spaceId: currentSpace!.id
    });
    setInlineVotes({
      ...inlineVotes,
      [extendedVote.id]: extendedVote
    });
    return extendedVote;
  }

  async function deleteVote (voteId: string) {
    await charmClient.deleteVote(voteId);
    delete inlineVotes[voteId];
    setInlineVotes({ ...inlineVotes });
  }

  async function cancelVote (voteId: string) {
    await charmClient.cancelVote(voteId);
    inlineVotes[voteId] = {
      ...inlineVotes[voteId],
      status: 'Cancelled'
    };
    setInlineVotes({ ...inlineVotes });
  }

  useEffect(() => {
    setInlineVotes(data?.reduce((acc, voteWithUser) => ({ ...acc, [voteWithUser.id]: voteWithUser }), {}) || {});
  }, [data]);

  const value: IContext = useMemo(() => ({
    inlineVotes,
    isValidating,
    castVote,
    createVote,
    deleteVote,
    cancelVote
  }), [currentPageId, inlineVotes, isValidating]);

  return (
    <InlineVotesContext.Provider value={value}>
      {children}
    </InlineVotesContext.Provider>
  );
}

export const useInlineVotes = () => useContext(InlineVotesContext);
