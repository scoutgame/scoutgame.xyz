import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { filterPropertyTemplates } from 'components/common/BoardEditor/utils/updateVisibilePropertyIds';
import { PageIcon } from 'components/common/PageLayout/components/PageIcon';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { isTouchScreen } from 'lib/utilities/browser';

import { Constants } from '../../constants';
import { useSortable } from '../../hooks/sortable';
import Button from '../../widgets/buttons/button';
import Editable from '../../widgets/editable';
import PropertyValueElement from '../propertyValueElement';

type Props = {
  hasContent?: boolean;
  board: Board;
  activeView: BoardView;
  card: Card;
  pageIcon?: string | null;
  pageTitle: string;
  isSelected: boolean;
  focusOnMount: boolean;
  showCard: (cardId: string) => void;
  readOnly: boolean;
  offset: number;
  pageUpdatedAt: string;
  pageUpdatedBy: string;
  resizingColumn: string;
  columnRefs: Map<string, React.RefObject<HTMLDivElement>>;
  onClick?: (e: React.MouseEvent<HTMLDivElement>, card: Card) => void;
  onDrop: (srcCard: Card, dstCard: Card) => void;
  saveTitle: (saveType: string, cardId: string, title: string) => void;
};

export const columnWidth = (
  resizingColumn: string,
  columnWidths: Record<string, number>,
  offset: number,
  templateId: string
): number => {
  if (resizingColumn === templateId) {
    return Math.max(Constants.minColumnWidth, (columnWidths[templateId] || 0) + offset);
  }
  return Math.max(Constants.minColumnWidth, columnWidths[templateId] || 0);
};

function TableRow(props: Props) {
  const {
    hasContent,
    board,
    activeView,
    columnRefs,
    card,
    pageIcon,
    pageTitle,
    pageUpdatedAt,
    pageUpdatedBy,
    saveTitle
  } = props;
  const titleRef = useRef<{ focus(selectAll?: boolean): void }>(null);
  const [title, setTitle] = useState('');
  const isManualSort = activeView.fields.sortOptions.length === 0;
  const isGrouped = Boolean(activeView.fields.groupById);
  const [isDragging, isOver, cardRef] = useSortable(
    'card',
    card,
    !isTouchScreen() && !props.readOnly && (isManualSort || isGrouped),
    props.onDrop
  );

  useEffect(() => {
    if (props.focusOnMount) {
      setTimeout(() => titleRef.current?.focus(), 10);
    }
  }, []);

  useEffect(() => {
    setTitle(pageTitle);
  }, [pageTitle]);

  const visiblePropertyTemplates = useMemo(() => {
    return filterPropertyTemplates(activeView.fields.visiblePropertyIds, board.fields.cardProperties);
  }, [board.fields.cardProperties, activeView.fields.visiblePropertyIds]);

  let className = props.isSelected ? 'TableRow octo-table-row selected' : 'TableRow octo-table-row';
  if (isOver) {
    className += ' dragover';
  }
  if (isGrouped) {
    const groupID = activeView.fields.groupById || '';
    const groupValue = (card.fields.properties[groupID] as string) || 'undefined';
    if (activeView.fields.collapsedOptionIds.indexOf(groupValue) > -1) {
      className += ' hidden';
    }
  }

  return (
    <div
      className={className}
      onClick={(e) => props.onClick?.(e, card)}
      ref={cardRef}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {/* Columns, one per property */}
      {visiblePropertyTemplates.map((template) => {
        if (template.id === Constants.titleColumnId) {
          return (
            <div
              className='octo-table-cell title-cell'
              id='mainBoardHeader'
              style={{
                width: columnWidth(
                  props.resizingColumn,
                  props.activeView.fields.columnWidths,
                  props.offset,
                  Constants.titleColumnId
                )
              }}
              ref={columnRefs.get(Constants.titleColumnId)}
              key={template.id}
            >
              <div className='octo-icontitle'>
                <PageIcon isEditorEmpty={!hasContent} pageType='page' icon={pageIcon} />

                <Editable
                  ref={titleRef}
                  value={title}
                  placeholderText='Untitled'
                  onChange={(newTitle: string) => setTitle(newTitle)}
                  onSave={(saveType) => saveTitle(saveType, card.id, title)}
                  onCancel={() => setTitle(card.title || '')}
                  readOnly={props.readOnly}
                  spellCheck={true}
                />
              </div>

              <div className='open-button'>
                <Button onClick={() => props.showCard(props.card.id || '')}>
                  <FormattedMessage id='TableRow.open' defaultMessage='Open' />
                </Button>
              </div>
            </div>
          );
        }
        return (
          <div
            className='octo-table-cell'
            key={template.id}
            style={{
              width: columnWidth(props.resizingColumn, props.activeView.fields.columnWidths, props.offset, template.id)
            }}
            ref={columnRefs.get(template.id)}
          >
            <PropertyValueElement
              readOnly={props.readOnly}
              card={card}
              board={board}
              propertyTemplate={template}
              showEmptyPlaceholder={true}
              updatedAt={pageUpdatedAt}
              updatedBy={pageUpdatedBy}
              displayType='table'
              maxRows={3}
            />
          </div>
        );
      })}
      {/* empty column for actions on header row */}
      <div className='octo-table-cell' style={{ flexGrow: 1, borderRight: '0 none' }}></div>
    </div>
  );
}

export default memo(TableRow);
