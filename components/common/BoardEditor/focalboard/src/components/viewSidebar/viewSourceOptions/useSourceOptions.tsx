import { log } from '@charmverse/core/log';
import { stringUtils } from '@charmverse/core/utilities';
import Papa from 'papaparse';
import type { ChangeEvent } from 'react';
import { v4 as uuid } from 'uuid';

import charmClient from 'charmClient';
import { addNewCards, isValidCsvResult } from 'components/common/PageActions/utils/databasePageOptions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { Board, DataSourceType } from 'lib/focalboard/board';
import type { BoardView, BoardViewFields } from 'lib/focalboard/boardView';
import { createNewDataSource } from 'lib/focalboard/createNewDataSource';
import { createTableView } from 'lib/focalboard/tableView';

import mutator from '../../../mutator';
import { getBoards } from '../../../store/boards';
import { useAppSelector } from '../../../store/hooks';
import { getViews } from '../../../store/views';

export const allowedSourceDatabasePageTypes = ['board', 'inline_board'];
type Props = {
  rootBoard: Board;
  activeView?: BoardView;
  showView: (viewId: string) => void;
};

export function useSourceOptions({ rootBoard, showView, activeView }: Props) {
  const { pages, updatePage } = usePages();
  const { space } = useCurrentSpace();
  const { user } = useUser();
  const { members } = useMembers();

  const { showMessage } = useSnackbar();

  const boards = useAppSelector(getBoards);

  const rootBoardPage = pages[rootBoard.id];

  const views = useAppSelector(getViews);

  async function onSelectLinkedDatabase({ sourceDatabaseId }: { sourceDatabaseId: string }) {
    if (!stringUtils.isUUID(sourceDatabaseId)) {
      return;
    }

    const sourceBoard = boards[sourceDatabaseId];
    const sourcePage = pages[sourceDatabaseId];

    if (
      !sourceBoard ||
      !sourcePage ||
      !allowedSourceDatabasePageTypes.includes(sourcePage.type) ||
      !rootBoardPage ||
      !rootBoardPage.type.match('linked') ||
      activeView?.fields.linkedSourceId === sourceDatabaseId
    ) {
      return;
    }

    // We want to get the view from the source database to copy over props such as visible property IDs
    const relatedSourceView = Object.values(views).find((view) => view.parentId === sourceDatabaseId);
    const constructedView = createTableView({ board: rootBoard, activeView: relatedSourceView });

    const viewId = activeView ? activeView.id : uuid();

    // After migrating sourceData and sourceType, this should only be used for linked views
    constructedView.id = viewId;
    constructedView.title = sourcePage.title ?? '';
    constructedView.fields.viewType = relatedSourceView?.fields.viewType ?? 'table';
    constructedView.fields.linkedSourceId = sourceDatabaseId;
    constructedView.fields.groupById = relatedSourceView?.fields.groupById;
    constructedView.fields.visibleOptionIds = relatedSourceView?.fields.visibleOptionIds ?? [];
    constructedView.fields.visiblePropertyIds = relatedSourceView?.fields.visiblePropertyIds ?? [];

    if (activeView) {
      await mutator.updateBlock(constructedView, activeView, 'change view source');
    } else {
      await mutator.insertBlock(constructedView, 'new view added');
    }

    showView(viewId);
  }
  function onCsvImport(event: ChangeEvent<HTMLInputElement>) {
    if (rootBoard && event.target.files && event.target.files[0]) {
      Papa.parse(event.target.files[0], {
        header: true,
        skipEmptyLines: true,
        worker: event.target.files[0].size > 100000, // 100kb
        delimiter: '\n', // fallback for a csv with 1 column
        complete: async (results) => {
          if (results.errors && results.errors[0]) {
            log.warn('CSV import failed', { spaceId: space?.id, pageId: rootBoard.id, error: results.errors[0] });
            showMessage(results.errors[0].message ?? 'There was an error importing your csv file.', 'warning');
            return;
          }

          if (isValidCsvResult(results)) {
            if (!user || !space) {
              throw new Error(
                'An error occured while importing. Please verify you have a valid user, space and board.'
              );
            }

            const spaceId = space?.id;
            const pageId = rootBoard.id;

            showMessage('Importing your csv file...', 'info');

            try {
              const view = activeView ?? (await onCreateDatabase({ sourceType: 'board_page' }));
              await addNewCards({
                board: rootBoard,
                members,
                results,
                spaceId: space?.id,
                userId: user.id,
                views: [view]
              });

              if (spaceId) {
                charmClient.track.trackAction('import_page_csv', { pageId, spaceId });
              }
              showMessage('Your csv file was imported successfully', 'success');
            } catch (error) {
              log.error('CSV import failed', { spaceId, pageId, error });
              showMessage((error as Error).message || 'There was an error importing your csv file.', 'warning');
            }
          } else {
            showMessage('There was an error importing your csv file.', 'warning');
          }
        }
      });
    }
  }
  async function onSelectSourceGoogleForm(fields: Pick<BoardViewFields, 'sourceData' | 'sourceType'>) {
    const newView = createTableView({ board: rootBoard, activeView });
    newView.fields.sourceData = fields.sourceData;
    newView.fields.sourceType = fields.sourceType;

    if (activeView) {
      await mutator.updateBlock(newView, activeView, 'change view source');
    } else {
      await mutator.insertBlock(newView, 'create form response');
    }
  }

  async function onCreateDatabase({ sourceType }: { sourceType: Exclude<DataSourceType, 'google_form'> }) {
    if (!rootBoardPage || !rootBoardPage.type.match('board')) {
      throw new Error('No board page type exists');
    }

    const boardBlockUpdate: Board = { ...rootBoard, fields: { ...rootBoard.fields, sourceType } };

    await mutator.updateBlock(boardBlockUpdate, rootBoard, 'Update board datasource');
    const { view } = await createNewDataSource({
      board: boardBlockUpdate,
      updatePage,
      currentPageType: rootBoardPage.type
    });
    showView(view.id);
    return view;
  }

  return {
    onSelectLinkedDatabase,
    onCsvImport,
    onSelectSourceGoogleForm,
    onCreateDatabase
  };
}
