import { isEmptyDocument } from '@bangle.dev/utils';
import styled from '@emotion/styled';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import type { SelectProps } from '@mui/material';
import { Box, InputLabel, List, MenuItem, Select, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import React, { memo, useLayoutEffect, useMemo, useState } from 'react';

import type { PageSidebarView } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { useEditorViewContext } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import PageThread from 'components/common/CharmEditor/components/thread/PageThread';
import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import { useInlineComment } from 'hooks/useInlineComment';
import type { CommentThreadsMap } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import { extractThreadIdsFromDoc } from 'lib/prosemirror/plugins/inlineComments/extractDeletedThreadIds';
import { findTotalInlineComments } from 'lib/prosemirror/plugins/inlineComments/findTotalInlineComments';
import { removeInlineCommentMark } from 'lib/prosemirror/plugins/inlineComments/removeInlineCommentMark';
import type { ThreadWithComments } from 'lib/threads/interfaces';
import { highlightDomElement, setUrlWithoutRerender } from 'lib/utilities/browser';
import { isTruthy } from 'lib/utilities/types';

const Center = styled.div`
  text-align: center;
  display: flex;
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing(3)};
  padding-bottom: ${({ theme }) => theme.spacing(3)};
  flex-direction: column;
`;

export const StyledSidebar = styled(List)`
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: 0px;
  padding-bottom: 0px;
`;

const EmptyThreadContainerBox = styled(Box)`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.palette.background.light};
`;

function CommentsSidebarComponent({
  canCreateComments,
  threads,
  openSidebar
}: {
  threads: CommentThreadsMap;
  canCreateComments: boolean;
  openSidebar: (view: PageSidebarView) => void;
}) {
  const router = useRouter();
  const { user } = useUser();

  const allThreads = useMemo(() => Object.values(threads).filter(isTruthy), [threads]);
  const unResolvedThreads = allThreads.filter((thread) => thread && !thread.resolved);
  const resolvedThreads = allThreads.filter((thread) => thread && thread.resolved);
  const [threadFilter, setThreadFilter] = useState<'resolved' | 'open' | 'all' | 'you'>('open');
  const handleThreadClassChange: SelectProps['onChange'] = (event) => {
    setThreadFilter(event.target.value as any);
  };
  const lastHighlightedCommentId = React.useRef<string | null>(null);
  let threadList: ThreadWithComments[] = [];
  if (threadFilter === 'resolved') {
    threadList = resolvedThreads;
  } else if (threadFilter === 'open') {
    threadList = unResolvedThreads;
  } else if (threadFilter === 'all') {
    threadList = allThreads as ThreadWithComments[];
  } else if (threadFilter === 'you') {
    // Filter the threads where there is at-least a single comment by the current user
    threadList = unResolvedThreads.filter((unResolvedThread) =>
      unResolvedThread.comments.some((comment) => comment.userId === user?.id)
    );
  }

  const view = useEditorViewContext();

  // view.state.doc stays the same (empty content) even when the document content changes
  const extractedThreadIds = isEmptyDocument(view.state.doc)
    ? new Set(Object.keys(threads))
    : extractThreadIdsFromDoc(view.state.doc, specRegistry.schema);

  // Making sure the position sort doesn't filter out comments that are not in the view
  const inlineThreadsIds = Array.from(
    new Set([
      ...findTotalInlineComments(view.state.schema, view.state.doc, threads, true).threadIds,
      ...allThreads.map((thread) => thread?.id)
    ])
  ).filter((id) => extractedThreadIds.has(id));

  const threadListSet = new Set(threadList.map((thread) => thread.id));
  const sortedThreadList = inlineThreadsIds
    .filter((inlineThreadsId) => threadListSet.has(inlineThreadsId))
    .map((filteredThreadId) => threads[filteredThreadId])
    .filter(isTruthy);
  const { updateThreadPluginState } = useInlineComment();

  useLayoutEffect(() => {
    // Highlight the comment id when navigation from nexus mentioned tasks list tab

    const highlightedCommentId = router.query.inlineCommentId;

    if (typeof highlightedCommentId === 'string' && highlightedCommentId !== lastHighlightedCommentId.current) {
      openSidebar('comments');
      const isHighlightedResolved = resolvedThreads.some((thread) =>
        thread.comments.some((comment) => comment.id === highlightedCommentId)
      );
      if (isHighlightedResolved) {
        setThreadFilter('resolved');
      }

      // Remove query parameters from url
      setUrlWithoutRerender(router.pathname, { inlineCommentId: null });

      requestAnimationFrame(() => {
        const highlightedCommentElement = document.getElementById(`comment.${highlightedCommentId}`);
        if (!highlightedCommentElement) {
          return;
        }

        highlightedCommentElement.scrollIntoView({
          behavior: 'smooth'
        });

        setTimeout(() => {
          requestAnimationFrame(() => {
            highlightDomElement(highlightedCommentElement as HTMLElement);
            lastHighlightedCommentId.current = highlightedCommentId;
          });
        }, 250);
      });
    }
  }, [router.query.inlineCommentId]);

  return (
    <>
      <Box display='flex' alignItems='center' gap={1}>
        <InputLabel>Filter</InputLabel>
        <Select variant='outlined' value={threadFilter} onChange={handleThreadClassChange}>
          <MenuItem value='open'>Open</MenuItem>
          <MenuItem value='resolved'>Resolved</MenuItem>
          <MenuItem value='you'>For you</MenuItem>
          <MenuItem value='all'>All</MenuItem>
        </Select>
      </Box>
      <StyledSidebar className='charm-inline-comment-sidebar' sx={{ height: '100%' }}>
        {sortedThreadList.length === 0 ? (
          <NoCommentsMessage
            icon={
              <MessageOutlinedIcon
                fontSize='large'
                color='secondary'
                sx={{
                  height: '2em',
                  width: '2em'
                }}
              />
            }
            message={`No ${threadFilter} comments yet`}
          />
        ) : (
          sortedThreadList.map(
            (resolvedThread) =>
              resolvedThread && (
                <PageThread
                  canCreateComments={canCreateComments}
                  showFindButton
                  key={resolvedThread.id}
                  threadId={resolvedThread.id}
                  onDeleteComment={() => {
                    removeInlineCommentMark(view, resolvedThread.id, true);
                    updateThreadPluginState({
                      remove: true,
                      threadId: resolvedThread.id
                    });
                  }}
                  onToggleResolve={(_, remove) => {
                    removeInlineCommentMark(view, resolvedThread.id);
                    updateThreadPluginState({
                      remove,
                      threadId: resolvedThread.id
                    });
                  }}
                />
              )
          )
        )}
      </StyledSidebar>
    </>
  );
}

export function NoCommentsMessage({
  icon,
  message,
  children
}: {
  icon: ReactNode;
  message: string;
  children?: ReactNode;
}) {
  return (
    <EmptyThreadContainerBox>
      <Center id='center'>
        {icon}
        <Typography variant='subtitle1' color='secondary'>
          {message}
        </Typography>
        {children}
      </Center>
    </EmptyThreadContainerBox>
  );
}

export const CommentsSidebar = memo(CommentsSidebarComponent);
