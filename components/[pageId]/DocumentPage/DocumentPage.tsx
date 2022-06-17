import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import CommentsList from 'components/common/BoardEditor/focalboard/src/components/cardDetail/commentsList';
import { getCardComments } from 'components/common/BoardEditor/focalboard/src/store/comments';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import BountyIntegration from 'components/[pageId]/DocumentPage/components/BountyIntegration';
import { useCommentThreadsListDisplay } from 'hooks/useCommentThreadsListDisplay';
import { usePages } from 'hooks/usePages';
import { Page, PageContent } from 'models';
import { useRouter } from 'next/router';
import { memo, useCallback } from 'react';
import CharmEditor, { ICharmEditorOutput } from '../../common/CharmEditor/CharmEditor';
import PageBanner from './components/PageBanner';
import PageDeleteBanner from './components/PageDeleteBanner';
import PageHeader from './components/PageHeader';

export const Container = styled(Box)<{ top: number, fullWidth?: boolean }>`
  width: ${({ fullWidth }) => fullWidth ? '100%' : '860px'};
  max-width: 100%;
  margin: 0 auto ${({ top }) => top + 100}px;
  position: relative;
  top: ${({ top }) => top}px;
  padding-bottom: ${({ theme }) => theme.spacing(5)};

  padding: 0 40px;
  @media (min-width: 975px) {
    padding: 0 80px;
  }
`;

export interface IEditorProps {
  page: Page, setPage: (p: Partial<Page>) => void, readOnly?: boolean }

function Editor ({ page, setPage, readOnly = false }: IEditorProps) {
  const { pages } = usePages();
  const board = useAppSelector((state) => {
    if (page.type === 'card' && page.parentId) {
      const parentPage = pages[page.parentId];
      return parentPage?.boardId && parentPage?.type === 'board' ? state.boards.boards[parentPage.boardId] : null;
    }
    return null;
  });
  const cards = useAppSelector((state) => board ? Object.values(state.cards.cards).filter(card => card.parentId === board.id) : []);
  const boardViews = useAppSelector((state) => {
    if (board) {
      return Object.values(state.views.views).filter(view => view.parentId === board.id);
    }
    return [];
  });

  const activeView = boardViews[0];

  let pageTop = 100;
  if (page.headerImage) {
    pageTop = 50;
    if (page.icon) {
      pageTop = 80;
    }
  }
  else if (page.icon) {
    pageTop = 200;
  }

  const { showingCommentThreadsList } = useCommentThreadsListDisplay();

  const updatePageContent = useCallback((content: ICharmEditorOutput) => {
    setPage({ content: content.doc, contentText: content.rawText });
  }, [setPage]);

  const card = cards.find(_card => _card.id === page.id);

  const comments = useAppSelector(getCardComments(card?.id));

  const cardId = typeof window !== 'undefined' ? (new URLSearchParams(window.location.href)).get('cardId') : null;

  const showCommentThreadList = showingCommentThreadsList && !cardId;

  return (
    <ScrollableWindow hideScroll={showCommentThreadList}>
      <div style={{
        width: showCommentThreadList ? 'calc(100% - 425px)' : '100%',
        height: showCommentThreadList ? 'calc(100vh - 65px)' : '100%',
        overflow: showCommentThreadList ? 'auto' : 'inherit'
      }}
      >
        {page.deletedAt && <PageDeleteBanner pageId={page.id} />}
        {page.headerImage && <PageBanner headerImage={page.headerImage} setPage={setPage} />}
        <Container
          top={pageTop}
          fullWidth={page.fullWidth ?? false}
        >
          <CharmEditor
            key={page.id}
            content={page.content as PageContent}
            onContentChange={updatePageContent}
            readOnly={readOnly}
            showingCommentThreadsList={showCommentThreadList}
            pageId={page.id}
          >
            <PageHeader
              headerImage={page.headerImage}
              icon={page.icon}
              title={page.title}
              readOnly={readOnly}
              setPage={setPage}
            />
            {card && board && (
            <div className='CardDetail content'>
              {/* Property list */}
              <Box sx={{
                display: 'flex',
                gap: 1,
                justifyContent: 'space-between',
                width: '100%'
              }}
              >
                <CardDetailProperties
                  board={board}
                  card={card}
                  cards={cards}
                  activeView={activeView}
                  views={boardViews}
                  readonly={readOnly}
                  pageUpdatedAt={page.updatedAt.toString()}
                  pageUpdatedBy={page.updatedBy}
                />
                <BountyIntegration linkedTaskId={card.id} title={page.title} readonly={readOnly} />
              </Box>

              <hr />
              <CommentsList
                comments={comments}
                rootId={card.rootId}
                cardId={card.id}
                readonly={readOnly}
              />
            </div>
            )}
          </CharmEditor>
        </Container>
      </div>
    </ScrollableWindow>
  );
}

export default memo(Editor);
