/* eslint-disable max-len */
import styled from '@emotion/styled';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import ImageIcon from '@mui/icons-material/Image';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import type { Page } from '@prisma/client';
import dynamic from 'next/dynamic';
import type { KeyboardEvent } from 'react';
import React, { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { randomBannerImage } from 'components/[pageId]/DocumentPage/components/PageBanner';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import type { Board } from 'lib/focalboard/board';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { BlockIcons } from '../blockIcons';
import mutator from '../mutator';
import Button from '../widgets/buttons/button';
import Editable from '../widgets/editable';

import BlockIconSelector from './blockIconSelector';

const CharmEditor = dynamic(() => import('components/common/CharmEditor'), {
  ssr: false
});

const BoardTitleEditable = styled(Editable)`
  font-size: 32px;
  font-weight: 700;
  line-height: 32px;
  margin: 0 0 10px;
`;

const InlineBoardTitleEditable = styled(BoardTitleEditable)`
  font-size: 22px;
`;

type ViewTitleInlineProps = {
  board: Board;
  readOnly: boolean;
  setPage: (page: Partial<Page>) => void;
};

type ViewTitleProps = ViewTitleInlineProps & {
  pageIcon?: string | null;
};

// NOTE: This is actually the title of the board, not a particular view
function ViewTitle(props: ViewTitleProps) {
  const { board, pageIcon } = props;

  const [title, setTitle] = useState(board.title);
  const onEditTitleSave = useCallback(() => {
    mutator.changeTitle(board.id, board.title, title);
    props.setPage({ title });
  }, [board.id, board.title, title]);
  const onEditTitleCancel = useCallback(() => {
    setTitle(board.title);
    props.setPage({ title: board.title });
  }, [board.title]);
  const onDescriptionChange = useCallback(
    (text: PageContent) => mutator.changeDescription(board.id, board.fields.description, text),
    [board.id, board.fields.description]
  );
  const onAddRandomIcon = useCallback(() => {
    const newIcon = BlockIcons.shared.randomIcon();
    props.setPage({ icon: newIcon });
  }, [board.id]);
  const setRandomHeaderImage = useCallback(
    (headerImage?: string | null) => {
      const newHeaderImage = headerImage ?? randomBannerImage();
      // Null is passed if we want to remove the image
      mutator.changeHeaderImage(board.id, board.fields.headerImage, headerImage !== null ? newHeaderImage : null);
    },
    [board.id, board.fields.headerImage]
  );
  const onShowDescription = useCallback(
    () => mutator.showDescription(board.id, Boolean(board.fields.showDescription), true),
    [board.id, board.fields.showDescription]
  );
  const onHideDescription = useCallback(
    () => mutator.showDescription(board.id, Boolean(board.fields.showDescription), false),
    [board.id, board.fields.showDescription]
  );

  const intl = useIntl();

  return (
    <div className='ViewTitle'>
      <div className='add-buttons add-visible'>
        {!props.readOnly && !board.fields.headerImage && (
          <div className='add-buttons'>
            <Button
              onClick={() => setRandomHeaderImage()}
              icon={<ImageIcon fontSize='small' sx={{ marginRight: 1 }} />}
            >
              <FormattedMessage id='CardDetail.add-cover' defaultMessage='Add cover' />
            </Button>
          </div>
        )}
        {!props.readOnly && !pageIcon && (
          <Button
            onClick={onAddRandomIcon}
            icon={
              <EmojiEmotionsOutlinedIcon
                fontSize='small'
                sx={{
                  mr: 1
                }}
              />
            }
          >
            <FormattedMessage id='TableComponent.add-icon' defaultMessage='Add icon' />
          </Button>
        )}
        {!props.readOnly && board.fields.showDescription && (
          <Button
            onClick={onHideDescription}
            icon={
              <VisibilityOffOutlinedIcon
                sx={{
                  mr: 1
                }}
              />
            }
          >
            <FormattedMessage id='ViewTitle.hide-description' defaultMessage='hide description' />
          </Button>
        )}
        {!props.readOnly && !board.fields.showDescription && (
          <Button
            onClick={onShowDescription}
            icon={
              <VisibilityOutlinedIcon
                sx={{
                  mr: 1
                }}
              />
            }
          >
            <FormattedMessage id='ViewTitle.show-description' defaultMessage='show description' />
          </Button>
        )}
      </div>

      <div data-test='board-title'>
        <BlockIconSelector readOnly={props.readOnly} pageIcon={pageIcon} setPage={props.setPage} />
        <BoardTitleEditable
          value={title}
          placeholderText={intl.formatMessage({ id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled board' })}
          onChange={(newTitle) => setTitle(newTitle)}
          saveOnEsc={true}
          onSave={onEditTitleSave}
          onCancel={onEditTitleCancel}
          readOnly={props.readOnly}
          spellCheck={true}
        />
      </div>

      {board.fields.showDescription && (
        <div className='description'>
          <CharmEditor
            disablePageSpecificFeatures
            isContentControlled={true}
            content={board.fields.description}
            onContentChange={(content: ICharmEditorOutput) => {
              onDescriptionChange(content.doc);
            }}
            pageId={board.id}
            readOnly={props.readOnly}
          />
        </div>
      )}
    </div>
  );
}

export function InlineViewTitle(props: ViewTitleInlineProps) {
  const { board } = props;

  const [title, setTitle] = useState(board.title);
  const onEditTitleSave = useCallback(() => {
    mutator.changeTitle(board.id, board.title, title);
    props.setPage({ title });
  }, [board.id, board.title, title]);

  // cancel key events, such as "Delete" or "Backspace" so that prosemiror doesnt pick them up on inline dbs
  function cancelEvent(e: KeyboardEvent<HTMLDivElement>) {
    e.stopPropagation();
  }

  return (
    <div onKeyDown={cancelEvent}>
      <InlineBoardTitleEditable
        value={title}
        placeholderText='Untitled'
        onChange={(newTitle) => setTitle(newTitle)}
        saveOnEsc={true}
        onSave={onEditTitleSave}
        readOnly={props.readOnly}
        spellCheck={true}
      />
    </div>
  );
}

export default React.memo(ViewTitle);
