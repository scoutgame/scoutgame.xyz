import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Box, Typography } from '@mui/material';
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import React, { useState } from 'react';

import charmClient from 'charmClient';
import { PageSizeInputPopup } from 'components/PageSizeInputPopup';
import { NewWorkButton } from 'components/rewards/components/RewardApplications/NewWorkButton';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { DEFAULT_PAGE_SIZE, usePaginatedData } from 'hooks/usePaginatedData';
import type { Board } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import type { Card, CardWithRelations } from 'lib/databases/card';

import TableRow from './tableRow';

type Props = {
  board: Board;
  activeView: BoardView;
  columnRefs: Map<string, React.RefObject<HTMLDivElement>>;
  cards: readonly CardWithRelations[];
  offset: number;
  resizingColumn: string;
  selectedCardIds: string[];
  readOnly: boolean;
  cardIdToFocusOnRender: string;
  showCard: (cardId: string, parentId?: string) => void;
  addCard: (groupByOptionId?: string) => Promise<void> | void;
  onCardClicked: (e: React.MouseEvent, card: Card) => void;
  onDrop: (srcCard: Card, dstCard: Card) => void;
  onDeleteCard?: (cardId: string) => Promise<void>;
  readOnlyTitle?: boolean;
  expandSubRowsOnLoad?: boolean;
  rowExpansionLocalStoragePrefix?: string;
  subRowsEmptyValueContent?: ReactElement | string;
  checkedIds?: string[];
  setCheckedIds?: Dispatch<SetStateAction<string[]>>;
};

function TableRows(props: Props): JSX.Element {
  const {
    board,
    cards: allCards,
    activeView,
    onDeleteCard,
    expandSubRowsOnLoad,
    subRowsEmptyValueContent,
    setCheckedIds,
    checkedIds = []
  } = props;
  const hasSubPages = allCards.some((card) => card.subPages?.length);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { rewards = [] } = useRewards();
  const {
    data: cardsInView,
    hasNextPage,
    showNextPage
  } = usePaginatedData(allCards as CardWithRelations[], { pageSize });

  const [collapsedCardIds = [], setCollapsedCardIds] = useLocalStorage<string[]>(
    hasSubPages && props.rowExpansionLocalStoragePrefix
      ? `${props.rowExpansionLocalStoragePrefix}-collapsed-rows`
      : null,
    []
  );

  const setIsExpanded = ({ cardId, expanded }: { expanded: boolean; cardId: string }) => {
    setCollapsedCardIds((prev) => (expanded ? prev?.filter((id) => id !== cardId) ?? [] : [...(prev ?? []), cardId]));
  };

  const saveTitle = React.useCallback(async (saveType: string, cardId: string, title: string, oldTitle: string) => {
    // ignore if title is unchanged
    if (title === oldTitle) {
      return;
    }
    await charmClient.pages.updatePage({ id: cardId, title });

    if (saveType === 'onEnter') {
      const card = cardsInView.find((c) => c.id === cardId);
      if (card && cardsInView.length > 0 && cardsInView[cardsInView.length - 1] === card) {
        props.addCard(
          activeView.fields.groupById ? (card.fields.properties[activeView.fields.groupById!] as string) : ''
        );
      }
    }
  }, []);

  const isExpanded = (cardId: string) => {
    return collapsedCardIds === null
      ? false
      : collapsedCardIds?.length !== 0
      ? !collapsedCardIds?.includes(cardId)
      : !!props.expandSubRowsOnLoad;
  };

  return (
    <>
      {cardsInView.map((card) => {
        const reward = rewards.find((r) => r.id === card.reward?.id);

        return (
          <TableRow
            key={card.id + card.updatedAt}
            board={board}
            activeView={activeView}
            card={card}
            hasContent={card.hasContent}
            isSelected={props.selectedCardIds.includes(card.id)}
            focusOnMount={props.cardIdToFocusOnRender === card.id}
            pageIcon={card.icon}
            pageTitle={card.title || ''}
            pageUpdatedAt={card.updatedAt.toString()}
            pageUpdatedBy={card.updatedBy}
            onClick={props.onCardClicked}
            saveTitle={saveTitle}
            showCard={props.showCard}
            readOnly={props.readOnly}
            onDrop={props.onDrop}
            onDeleteCard={onDeleteCard}
            offset={props.offset}
            resizingColumn={props.resizingColumn}
            columnRefs={props.columnRefs}
            readOnlyTitle={props.readOnlyTitle}
            subPages={card.subPages}
            expandSubRowsOnLoad={expandSubRowsOnLoad}
            setIsExpanded={setIsExpanded}
            setCheckedIds={setCheckedIds}
            isChecked={checkedIds.includes(card.id)}
            emptySubPagesPlaceholder={
              reward ? (
                <Box
                  p={1}
                  pl={5}
                  display='flex'
                  justifyContent='flex-start'
                  style={{ backgroundColor: 'var(--input-bg)' }}
                >
                  <NewWorkButton color='secondary' reward={reward} addIcon variant='text' buttonSize='small' />
                </Box>
              ) : null
            }
            isExpanded={isExpanded(card.id)}
            subRowsEmptyValueContent={subRowsEmptyValueContent}
          />
        );
      })}

      {hasNextPage && (
        <div className='octo-table-footer'>
          <div className='octo-table-cell' onClick={showNextPage}>
            <Box display='flex' gap={1} alignItems='center'>
              <ArrowDownwardIcon fontSize='small' />
              <Typography fontSize='small'>Load more</Typography>
              <PageSizeInputPopup onChange={setPageSize} pageSize={pageSize} />
            </Box>
          </div>
        </div>
      )}
    </>
  );
}

export default TableRows;
