import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { KeyedMutator } from 'swr';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentPage } from 'hooks/useCurrentPage';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { ThreadWithComments } from 'lib/threads/interfaces';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import { useCurrentSpace } from './useCurrentSpace';
import { useWebSocketClient } from './useWebSocketClient';

type IContext = {
  isLoading: boolean;
  threads: Record<string, ThreadWithComments | undefined>;
  currentPageId: string | null;
  // setThreads: Dispatch<SetStateAction<Record<string, ThreadWithComments | undefined> | null>>;
  addComment: (threadId: string, commentContent: PageContent) => Promise<void>;
  editComment: (threadId: string, commentId: string, commentContent: PageContent) => Promise<void>;
  deleteComment: (threadId: string, commentId: string) => Promise<void>;
  resolveThread: (threadId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  refetchThreads: KeyedMutator<ThreadWithComments[]>;
};

export function getThreadsKey(pageId: string) {
  return `pages/${pageId}/threads`;
}

export const ThreadsContext = createContext<Readonly<IContext>>({
  isLoading: true,
  currentPageId: null,
  threads: {},
  // setThreads: () => undefined,
  addComment: () => undefined as any,
  editComment: () => undefined as any,
  deleteComment: () => undefined as any,
  resolveThread: () => undefined as any,
  deleteThread: () => undefined as any,
  refetchThreads: undefined as any
});

export type CommentThreadsMap = Record<string, ThreadWithComments | undefined>;

export function ThreadsProvider({ children }: { children: ReactNode }) {
  const { currentPageId } = useCurrentPage();
  const { subscribe } = useWebSocketClient();
  const { spaceRole } = useCurrentSpace();

  const { data, isValidating, mutate } = useSWR(
    () => (currentPageId ? getThreadsKey(currentPageId) : null),
    () => charmClient.comments.getThreads(currentPageId),
    { revalidateOnFocus: false }
  );
  const threads = (data || []).reduce<CommentThreadsMap>((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  const threadsUpdatedHandler = useCallback(
    (payload: WebSocketPayload<'threads_updated'>) => {
      if (payload.pageId === currentPageId) {
        mutate();
      }
    },
    [currentPageId]
  );

  useEffect(() => {
    if (spaceRole && !spaceRole.isGuest) {
      const unsubscribeFromThreadsUpdatedEvent = subscribe('threads_updated', threadsUpdatedHandler);

      return () => {
        unsubscribeFromThreadsUpdatedEvent();
      };
    }
  }, [spaceRole, currentPageId]);

  async function addComment(threadId: string, commentContent: PageContent) {
    const thread = threads?.[threadId];
    if (thread) {
      const comment = await charmClient.comments.addComment({
        content: commentContent,
        threadId: thread.id
      });
      mutate();
    }
  }

  async function editComment(threadId: string, editedCommentId: string, commentContent: PageContent) {
    const thread = threads?.[threadId];
    if (thread) {
      await charmClient.comments.editComment(editedCommentId, commentContent);
      mutate();
    }
  }

  async function deleteComment(threadId: string, commentId: string) {
    const thread = threads?.[threadId];
    if (thread) {
      const comment = thread.comments.find((_comment) => _comment.id === commentId);
      if (comment) {
        await charmClient.comments.deleteComment(comment.id);
        mutate();
      }
    }
  }

  async function resolveThread(threadId: string) {
    const thread = threads?.[threadId];

    if (thread) {
      await charmClient.comments.resolveThread(thread.id, {
        resolved: !thread.resolved
      });
      mutate();
    }
  }

  async function deleteThread(threadId: string) {
    const thread = threads?.[threadId];

    if (thread && threads) {
      await charmClient.comments.deleteThread(thread.id);
      mutate();
    }
  }

  const value: IContext = useMemo(
    () => ({
      threads,
      addComment,
      editComment,
      deleteComment,
      resolveThread,
      deleteThread,
      currentPageId,
      isLoading: isValidating,
      refetchThreads: mutate
    }),
    // we only update the result when threads changes, because it is set after everything else inside a useEffect() hook
    [data, isValidating]
  );

  return <ThreadsContext.Provider value={value}>{children}</ThreadsContext.Provider>;
}

export const useThreads = () => useContext(ThreadsContext);
