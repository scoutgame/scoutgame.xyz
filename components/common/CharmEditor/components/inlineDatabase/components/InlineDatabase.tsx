
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { NodeViewProps } from '@bangle.dev/core';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { getViewCardsSortedFilteredAndGrouped } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { getClientConfig } from 'components/common/BoardEditor/focalboard/src/store/clientConfig';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getCurrentViewDisplayBy, getCurrentViewGroupBy, getView, getSortedViews } from 'components/common/BoardEditor/focalboard/src/store/views';
import CardDialog from 'components/common/BoardEditor/focalboard/src/components/cardDialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import { usePages } from 'hooks/usePages';
import FocalBoardPortal from 'components/common/BoardEditor/FocalBoardPortal';
import log from 'lib/log';
import styled from '@emotion/styled';
import { isTruthy } from 'lib/utilities/types';

import BoardSelection from './BoardSelection';
import ViewSelection from './ViewSelection';

// Lazy load focalboard entrypoint (ignoring the redux state stuff for now)
const CenterPanel = dynamic(() => import('components/common/BoardEditor/focalboard/src/components/centerPanel'), {
  ssr: false
});

const StylesContainer = styled.div`

  .BoardComponent {
    overflow: visible;
  }

  .container-container {
    min-width: unset;
    overflow-x: auto;
    padding: 0;
    // offset padding around document
    margin: 0 -24px;
    padding-left: 24px;
    ${({ theme }) => theme.breakpoints.up('md')} {
      margin: 0 -80px;
      padding-left: 80px;
    }
  }

  // remove extra padding on Table view
  .Table {
    margin-top: 0;

    // Hide calculations footer
    .CalculationRow {
      display: none;
    }
  }

  // remove extra padding on Kanban view
  .octo-board-header {
    padding-top: 0;
  }

  // remove extra margin on calendar view
  .fc .fc-toolbar.fc-header-toolbar {
    margin-top: 0;
  }

  // adjust columns on Gallery view
  @media screen and (min-width: 600px) {
    .Gallery {
      padding-right: 48px; // offset the left padding from .container-container
      ${({ theme }) => theme.breakpoints.up('md')} {
        padding-right: 80px;
      }
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .GalleryCard {
      width: auto;
    }
  }
`;

interface DatabaseViewProps extends NodeViewProps {
  readOnly?: boolean;
}

interface DatabaseViewAttrs {
  pageIds: string[];
  viewIds: string[];
  sources: ('board_page')[];
}

export default function DatabaseView ({ readOnly: readOnlyOverride, node, updateAttrs }: DatabaseViewProps) {

  const [attrs, setAttrs] = useState<DatabaseViewAttrs>(node.attrs as DatabaseViewAttrs);

  const boards = useAppSelector(getSortedBoards);
  // Always display the first page and view
  const pageId = attrs.pageIds[0];
  const viewId = attrs.viewIds[0];

  const board = boards.find(b => b.id === pageId);
  const cards = useAppSelector(getViewCardsSortedFilteredAndGrouped({
    boardId: pageId || '',
    viewId: viewId || ''
  }));
  const allViews = useAppSelector(getSortedViews);
  const boardViews = allViews.filter(view => view.parentId === pageId);
  const activeView = useAppSelector(getView(viewId || ''));
  const groupByProperty = useAppSelector(getCurrentViewGroupBy);
  const dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy);
  const clientConfig = useAppSelector(getClientConfig);
  const { pages, getPagePermissions } = usePages();
  const [shownCardId, setShownCardId] = useState<string | undefined>('');

  const boardPages = Object.values(pages).filter(p => p?.type === 'board').filter(isTruthy);
  const accessibleCards = cards.filter(card => pages[card.id]);

  const currentPagePermissions = getPagePermissions(pageId || '');

  function showCard (cardId?: string) {
    setShownCardId(cardId);
  }

  function selectBoard (boardId: string) {
    const _boardViews = allViews.filter(view => view.parentId === boardId);
    const _viewId = _boardViews.length === 1 ? _boardViews[0].id : null;
    setAttrs({ sources: [...attrs.sources, 'board_page'], pageIds: [...attrs.pageIds, boardId], viewIds: _viewId ? [...attrs.viewIds, _viewId] : attrs.viewIds });
  }

  function clearSelection () {
    setAttrs(attrs);
  }

  function selectView (_viewId: string) {
    setAttrs(_attrs => ({ ..._attrs, viewIds: [..._attrs.viewIds, _viewId] }));
  }

  useEffect(() => {
    updateAttrs(attrs);
  }, [attrs]);

  if (!board) {
    return <BoardSelection pages={boardPages} onSelect={selectBoard} />;
  }

  if (!activeView) {
    return <ViewSelection views={boardViews} title={board.title} onSelect={selectView} onClickBack={clearSelection} />;
  }

  let property = groupByProperty;
  if ((!property || property.type !== 'select') && activeView.fields.viewType === 'board') {
    property = board?.fields.cardProperties.find((o: any) => o.type === 'select');
  }

  let displayProperty = dateDisplayProperty;
  if (!displayProperty && activeView.fields.viewType === 'calendar') {
    displayProperty = board.fields.cardProperties.find((o: any) => o.type === 'date');
  }

  const readOnly = typeof readOnlyOverride === 'undefined' ? currentPagePermissions.edit_content !== true : readOnlyOverride;

  return (
    <>
      <StylesContainer className='focalboard-body'>
        <Box mb={1}>
          <Typography variant='h3'>
            {board.title}
          </Typography>
        </Box>
        <CenterPanel
          clientConfig={clientConfig}
          readonly={readOnly}
          board={board}
          setPage={(p) => {
            log.warn('Ignoring update page properties of inline database', p);
          }}
          cards={accessibleCards}
          showCard={showCard}
          activeView={activeView}
          groupByProperty={property}
          dateDisplayProperty={displayProperty}
          views={boardViews}
        />
      </StylesContainer>
      {typeof shownCardId === 'string' && shownCardId.length !== 0 && (
        <RootPortal>
          <CardDialog
            key={shownCardId}
            cardId={shownCardId}
            onClose={() => showCard(undefined)}
            showCard={(cardId) => showCard(cardId)}
            readonly={readOnly}
          />
        </RootPortal>
      )}
      <FocalBoardPortal />
    </>
  );
}
