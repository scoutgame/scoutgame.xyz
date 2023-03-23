import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FavoritedIcon from '@mui/icons-material/Star';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import UndoIcon from '@mui/icons-material/Undo';
import VerticalAlignBottomOutlinedIcon from '@mui/icons-material/VerticalAlignBottomOutlined';
import { Box, Divider, Stack, Tooltip, Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useRouter } from 'next/router';
import Papa from 'papaparse';
import type { ChangeEventHandler } from 'react';

import charmClient from 'charmClient';
import { CsvExporter } from 'components/common/BoardEditor/focalboard/csvExporter/csvExporter';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import {
  getViewCardsSortedFilteredAndGrouped,
  sortCards
} from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getCurrentBoardViews, getView } from 'components/common/BoardEditor/focalboard/src/store/views';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import { DuplicatePageAction } from 'components/common/DuplicatePageAction';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useToggleFavorite } from 'hooks/useToggleFavorite';
import { useUser } from 'hooks/useUser';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { CardPage } from 'lib/focalboard/card';
import log from 'lib/log';
import type { IPagePermissionFlags } from 'lib/permissions/pages';

import { DocumentHistory } from './DocumentHistory';
import { isValidCsvResult, addNewCards } from './utils/databasePageOptions';

interface Props {
  closeMenu: () => void;
  pageId: string;
  pagePermissions?: IPagePermissionFlags;
}

export default function DatabaseOptions({ pagePermissions, closeMenu, pageId }: Props) {
  const router = useRouter();
  const { pages, deletePage } = usePages();
  const view = useAppSelector(getView(router.query.viewId as string));
  const boards = useAppSelector(getSortedBoards);
  const boardViews = useAppSelector(getCurrentBoardViews);
  const { isFavorite, toggleFavorite } = useToggleFavorite({ pageId });
  const { showMessage } = useSnackbar();
  const { members } = useMembers();
  const { user } = useUser();
  const currentSpace = useCurrentSpace();
  const { formatDateTime, formatDate } = useDateFormatter();

  const activeBoardId = view?.fields.sourceData?.boardId ?? view?.fields.linkedSourceId ?? view?.rootId;
  const board = boards.find((b) => b.id === activeBoardId);
  const lastUpdatedBy = members.find((member) => member.id === board?.createdBy);
  const boardPage = pages[pageId];

  function undoChanges() {
    if (mutator.canUndo) {
      const description = mutator.undoDescription;
      mutator.undo().then(() => {
        showMessage(description ? `Undo ${description}` : 'Undo', 'success');
      });
    } else {
      showMessage('Nothing to Undo', 'info');
    }
  }

  const cards = useAppSelector(
    getViewCardsSortedFilteredAndGrouped({
      boardId: board?.id ?? '',
      viewId: view?.id ?? ''
    })
  );

  async function onDeletePage() {
    await deletePage({
      pageId
    });
    closeMenu();
  }

  const exportCsv = (_board: Board, _view: BoardView) => {
    const cardPages: CardPage[] = cards
      .map((card) => ({ card, page: pages[card.id] }))
      .filter((item): item is CardPage => !!item.page);

    const sortedCardPages = sortCards(cardPages, _board, _view, members);
    const _cards = sortedCardPages.map(({ card, page }) => {
      return {
        ...card,
        // update the title from correct model
        title: page.title
      };
    });
    try {
      CsvExporter.exportTableCsv(_board, _view, _cards, {
        date: formatDate,
        dateTime: formatDateTime
      });
      showMessage('Export complete!');
    } catch (error) {
      log.error('CSV export failed', error);
      showMessage('Export failed', 'error');
    }
    closeMenu();
    const spaceId = pages[pageId]?.spaceId;
    if (spaceId) {
      charmClient.track.trackAction('export_page_csv', { pageId, spaceId });
    }
  };
  function onCopyLink() {
    Utils.copyTextToClipboard(window.location.href);
    showMessage('Copied link to clipboard', 'success');
    closeMenu();
  }

  const importCsv: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (board && event.target.files && event.target.files[0]) {
      Papa.parse(event.target.files[0], {
        header: true,
        skipEmptyLines: true,
        worker: event.target.files[0].size > 100000, // 100kb
        delimiter: '\n', // fallback for a csv with 1 column
        complete: async (results) => {
          closeMenu();
          if (results.errors && results.errors[0]) {
            log.warn('CSV import failed', { spaceId: currentSpace?.id, pageId, error: results.errors[0] });
            showMessage(results.errors[0].message ?? 'There was an error importing your csv file.', 'warning');
            return;
          }
          if (isValidCsvResult(results)) {
            try {
              if (!user || !currentSpace) {
                throw new Error(
                  'An error occured while importing. Please verify you have a valid user, space and board.'
                );
              }

              await addNewCards({
                board,
                members,
                results,
                spaceId: currentSpace.id,
                userId: user.id,
                views: boardViews
              });

              const spaceId = currentSpace?.id;
              if (spaceId) {
                charmClient.track.trackAction('import_page_csv', { pageId, spaceId });
              }
              showMessage('Your csv file was imported successfully', 'success');
            } catch (error) {
              log.error('CSV import failed', { spaceId: currentSpace?.id, pageId, error });
              showMessage((error as Error).message || 'Import failed', 'error');
            }
          }
        }
      });
    }
  };

  if (!board || !view) {
    return null;
  }

  return (
    <List dense>
      <ListItemButton
        onClick={() => {
          toggleFavorite();
          closeMenu();
        }}
      >
        <Box
          sx={{
            mr: 0.5,
            position: 'relative',
            left: -4,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {isFavorite ? <FavoritedIcon /> : <NotFavoritedIcon />}
        </Box>
        <ListItemText primary={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'} />
      </ListItemButton>
      {boardPage && (
        <DuplicatePageAction postDuplication={closeMenu} page={boardPage} pagePermissions={pagePermissions} />
      )}
      <ListItemButton onClick={onCopyLink}>
        <ContentCopyIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='Copy link' />
      </ListItemButton>
      <Divider />
      <Tooltip title={!pagePermissions?.delete ? "You don't have permission to delete this page" : ''}>
        <div>
          <ListItemButton disabled={!pagePermissions?.delete} onClick={onDeletePage}>
            <DeleteOutlinedIcon
              fontSize='small'
              sx={{
                mr: 1
              }}
            />
            <ListItemText primary='Delete' />
          </ListItemButton>
        </div>
      </Tooltip>
      <Tooltip
        title={
          !pagePermissions?.edit_content
            ? "You don't have permission to undo changes"
            : !mutator.canUndo
            ? 'Nothing to undo'
            : ''
        }
      >
        <div>
          <ListItemButton disabled={!mutator.canUndo || !pagePermissions?.edit_content} onClick={undoChanges}>
            <UndoIcon
              fontSize='small'
              sx={{
                mr: 1
              }}
            />
            <ListItemText primary='Undo' />
          </ListItemButton>
        </div>
      </Tooltip>
      <ListItemButton onClick={() => exportCsv(board, view)}>
        <FormatListBulletedIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='Export to CSV' />
      </ListItemButton>
      <ListItemButton component='label'>
        <input hidden type='file' name='csvfile' accept='.csv' onChange={importCsv} />
        <VerticalAlignBottomOutlinedIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='Import CSV' />
      </ListItemButton>
      <Divider />
      <DocumentHistory
        page={{
          createdAt: new Date(board.createdAt),
          createdBy: board.createdBy,
          updatedAt: new Date(board.updatedAt),
          updatedBy: board.updatedBy
        }}
      />
    </List>
  );
}
