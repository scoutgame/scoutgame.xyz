import useSWR from 'swr';
import charmClient from 'charmClient';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import { ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';
import { PageContent } from 'models';
import { usePages } from './usePages';

type IContext = {
  isValidating: boolean,
  threads: Record<string, ThreadWithCommentsAndAuthors | undefined>,
  setThreads: Dispatch<SetStateAction<Record<string, ThreadWithCommentsAndAuthors | undefined>>>,
  addComment: (threadId: string, commentContent: PageContent, thread?: ThreadWithCommentsAndAuthors | undefined) => Promise<void>,
  editComment: (threadId: string, commentId: string, commentContent: PageContent, thread?: ThreadWithCommentsAndAuthors) => Promise<void>,
  deleteComment: (threadId: string, commentId: string, thread?: ThreadWithCommentsAndAuthors) => Promise<void>,
  resolveThread: (threadId: string) => Promise<void>,
  deleteThread: (threadId: string, thread?: ThreadWithCommentsAndAuthors) => Promise<void>,
};

export const ThreadsContext = createContext<Readonly<IContext>>({
  isValidating: true,
  threads: {},
  setThreads: () => undefined,
  addComment: () => undefined as any,
  editComment: () => undefined as any,
  deleteComment: () => undefined as any,
  resolveThread: () => undefined as any,
  deleteThread: () => undefined as any
});

export function ThreadsProvider ({ children }: { children: ReactNode }) {
  const { currentPageId } = usePages();
  const [threads, setThreads] = useState<Record<string, ThreadWithCommentsAndAuthors | undefined>>({});

  const { data, isValidating } = useSWR(() => currentPageId ? `pages/${currentPageId}/threads` : null, () => charmClient.getPageThreads(currentPageId), { revalidateOnFocus: false });
  useEffect(() => {
    setThreads(data?.reduce((acc, page) => ({ ...acc, [page.id]: page }), {}) || {});
  }, [data]);

  async function addComment (threadId: string, commentContent: PageContent, thread?: ThreadWithCommentsAndAuthors | undefined) {
    if (!thread) {
      thread = threads[threadId];
    }

    if (thread) {
      try {
        const comment = await charmClient.addComment({
          content: commentContent,
          threadId: thread.id
        });
        if (thread.pageId) {
          const threadWithCommentsAndAuthors = thread as ThreadWithCommentsAndAuthors;
          setThreads((_threads) => ({ ..._threads,
            [threadWithCommentsAndAuthors.id]: {
              ...threadWithCommentsAndAuthors,
              comments: [...threadWithCommentsAndAuthors.comments, comment]
            } }));
        }
      }
      catch (_) {
        //
      }
    }
  }

  async function editComment (
    threadId: string,
    editedCommentId: string,
    commentContent: PageContent,
    thread?: ThreadWithCommentsAndAuthors
  ) {
    if (!thread) {
      thread = threads[threadId];
    }
    if (thread) {
      try {
        await charmClient.editComment(editedCommentId, commentContent);
        if (thread.pageId) {
          const threadWithCommentsAndAuthors = thread as ThreadWithCommentsAndAuthors;
          setThreads((_threads) => ({ ..._threads,
            [threadWithCommentsAndAuthors.id]: {
              ...threadWithCommentsAndAuthors,
              comments: threadWithCommentsAndAuthors.comments
                .map(comment => comment.id === editedCommentId ? ({ ...comment, content: commentContent, updatedAt: new Date() }) : comment)
            } }));
        }
      }
      catch (_) {
        //
      }
    }
  }

  async function deleteComment (
    threadId: string,
    commentId: string,
    thread?: ThreadWithCommentsAndAuthors
  ) {
    if (!thread) {
      thread = threads[threadId];
    }
    if (thread) {
      const comment = thread.comments.find(_comment => _comment.id === commentId);
      if (comment) {
        try {
          await charmClient.deleteComment(comment.id);
          if (thread.pageId) {
            const threadWithCommentsAndAuthors = thread as ThreadWithCommentsAndAuthors;
            const threadWithoutComment = {
              ...thread,
              comments: thread.comments.filter(_comment => _comment.id !== comment.id)
            };
            setThreads((_threads) => ({ ..._threads, [threadWithCommentsAndAuthors.id]: threadWithoutComment }));
          }
        }
        catch (_) {
          //
        }
      }
    }
  }

  async function resolveThread (threadId: string) {
    const thread = threads[threadId];

    if (thread) {
      try {
        await charmClient.updateThread(thread.id, {
          resolved: !thread.resolved
        });
        setThreads((_threads) => ({ ..._threads,
          [thread.id]: {
            ...thread,
            resolved: !thread.resolved
          } }));
      }
      catch (_) {
        //
      }
    }
  }

  async function deleteThread (threadId: string, thread?: ThreadWithCommentsAndAuthors) {
    if (!thread) {
      thread = threads[threadId];
    }

    if (thread) {
      try {
        await charmClient.deleteThread(thread.id);
        if (thread.pageId) {
          delete threads[thread.id];
          setThreads({ ...threads });
        }
      }
      catch (_) {
        //
      }
    }
  }

  const value: IContext = useMemo(() => ({
    threads,
    setThreads,
    addComment,
    editComment,
    deleteComment,
    resolveThread,
    deleteThread,
    isValidating
  }), [currentPageId, threads, isValidating]);

  return (
    <ThreadsContext.Provider value={value}>
      {children}
    </ThreadsContext.Provider>
  );
}

export const useThreads = () => useContext(ThreadsContext);
