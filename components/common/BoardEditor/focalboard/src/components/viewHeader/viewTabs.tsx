import styled from '@emotion/styled';
import {
  Edit as EditIcon,
  Tune as TuneIcon,
  DeleteOutline as DeleteOutlineIcon,
  ContentCopy as DuplicateIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Typography, Box, Stack } from '@mui/material';
import type { ButtonProps } from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type { TabProps } from '@mui/material/Tab';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { MouseEvent, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { IntlShape } from 'react-intl';
import { injectIntl } from 'react-intl';

import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import { formatViewTitle, createBoardView } from 'lib/focalboard/boardView';

import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import { IDType, Utils } from '../../utils';
import AddViewMenu from '../addViewMenu';
import { iconForViewType } from '../viewMenu';

// fix types for MUI Tab to include Button Props
const TabButton = Tab as React.ComponentType<TabProps & ButtonProps>;

const StyledTabContent = styled(Typography)`
  padding: ${({ theme }) => theme.spacing('6px', '2px', '6px')};
  width: 100%;

  span {
    display: inline-flex;
    gap: 4px;
    border-radius: 4px;
    padding: 4px 8px;
    width: 100%;
  }
  &:hover span {
    background-color: var(--button-text-hover);
  }
`;

interface ViewTabsProps {
  intl: IntlShape;
  activeView?: BoardView | null;
  board: Board;
  readOnly?: boolean;
  views: BoardView[];
  showView: (viewId: string) => void;
  addViewButton?: ReactNode;
  onDeleteView?: (viewId: string) => void;
  onClickNewView?: () => void;
  disableUpdatingUrl?: boolean;
  maxTabsShown: number;
  openViewOptions: () => void;
  viewIds: string[];
}

function ViewMenuItem({
  view,
  onClick,
  onDrop,
  href
}: {
  href: string;
  onDrop: (currentView: BoardView, dropzoneView: BoardView) => void;
  view: BoardView;
  onClick: VoidFunction;
}) {
  const [isDragging, isOver, columnRef] = useSortable('view', view, true, onDrop);
  return (
    <Stack
      ref={columnRef}
      sx={{
        overflow: 'unset',
        opacity: isDragging ? 0.5 : 1,
        transition: `background-color 150ms ease-in-out`,
        backgroundColor: isOver ? 'var(--charmeditor-active)' : 'initial',
        flexDirection: 'row'
      }}
    >
      <MenuItem
        onClick={onClick}
        href={href}
        component={Link}
        key={view.id}
        dense
        className={isOver ? 'dragover' : ''}
        sx={{ width: '100%' }}
      >
        <DragIndicatorIcon color='secondary' fontSize='small' sx={{ mr: 1 }} />
        <ListItemIcon>{iconForViewType(view.fields.viewType)}</ListItemIcon>
        <ListItemText>{view.title || formatViewTitle(view)}</ListItemText>
      </MenuItem>
    </Stack>
  );
}

function ViewTabs(props: ViewTabsProps) {
  const {
    onDeleteView,
    openViewOptions,
    maxTabsShown,
    disableUpdatingUrl,
    activeView,
    board,
    intl,
    readOnly,
    showView,
    views: viewsProp
  } = props;
  const router = useRouter();
  const [viewMenuAnchorEl, setViewMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [dropdownView, setDropdownView] = useState<BoardView | null>(null);
  const renameViewPopupState = usePopupState({ variant: 'popover', popupId: 'rename-view-popup' });
  const hiddenViewsPopupState = usePopupState({ variant: 'popover', popupId: 'show-views-popup' });
  const resetGoogleForms = usePopupState({ variant: 'popover', popupId: 'reset-google-forms' });
  const showViewsTriggerState = bindTrigger(hiddenViewsPopupState);
  const showViewsMenuState = bindMenu(hiddenViewsPopupState);

  const views = viewsProp.filter((view) => !view.fields.inline);
  const viewIds = props.viewIds.length !== 0 ? props.viewIds : views.map((view) => view.id);

  // Find the index of the current view
  const currentViewIndex = views.findIndex((view) => view.id === activeView?.id);
  const shownViews = views.slice(0, maxTabsShown);
  let restViews = views.slice(maxTabsShown);

  // If the current view index is more than what we can show in the screen
  if (currentViewIndex >= maxTabsShown) {
    const replacedView = shownViews[maxTabsShown - 1];
    // Replace the current view as the last view of the shown views
    shownViews[maxTabsShown - 1] = views[currentViewIndex];
    restViews = restViews.filter((restView) => restView.id !== activeView?.id);
    restViews.unshift(replacedView);
  }

  const viewsRecord = viewsProp.reduce((acc, view) => {
    acc[view.id] = view;
    return acc;
  }, {} as Record<string, BoardView>);

  // make sure active view id is visible or the value for Tabs will be invalid
  // during transition between boards, there is a period where activeView has not caught up with the new views
  const activeShowViewId =
    shownViews.find((view) => view.id === activeView?.id)?.id ??
    // check viewId by the query, there is a period where activeView has not caught up
    shownViews.find((view) => view.id === router.query.viewId)?.id ??
    shownViews[0]?.id ??
    false;

  const { register, handleSubmit, setValue } = useForm<{ title: string }>({
    defaultValues: { title: dropdownView?.title || '' }
  });

  function handleViewClick(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
    event.preventDefault();
    const viewId = event.currentTarget.id;
    const view = views.find((v) => v.id === viewId);
    if (!view) {
      return;
    }
    if (view && !readOnly && event.currentTarget.id === activeView?.id) {
      setViewMenuAnchorEl(event.currentTarget);
      setDropdownView(view);
    } else {
      showView(viewId);
    }
  }

  function handleClose() {
    hiddenViewsPopupState.close();
  }

  function closeViewMenu() {
    setViewMenuAnchorEl(null);
  }

  function getViewUrl(viewId: string) {
    const pathWithoutQuery = router.asPath.split('?')[0];
    return `${pathWithoutQuery}?viewId=${viewId}`;
  }

  const handleDuplicateView = useCallback(() => {
    if (!dropdownView) return;

    const newView = createBoardView(dropdownView);
    newView.title = `${dropdownView.title} copy`;
    newView.id = Utils.createGuid(IDType.View);
    mutator.insertBlock(
      newView,
      'duplicate view',
      async (block) => {
        showView(block.id);
      },
      async () => {
        showView(dropdownView.id);
      }
    );
  }, [dropdownView, showView]);

  const handleDeleteView = useCallback(async () => {
    Utils.log('deleteView');
    if (!dropdownView) return;

    setViewMenuAnchorEl(null);
    const nextView = views.find((o) => o !== dropdownView);
    await mutator.deleteBlock(dropdownView, 'delete view');
    onDeleteView?.(dropdownView.id);
    if (nextView) {
      showView(nextView.id);
    }
  }, [views, dropdownView, showView]);

  function resyncGoogleFormData() {
    if (dropdownView) {
      const newView = createBoardView(dropdownView);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { boardId, ...sourceDataWithoutBoard } = newView.fields.sourceData!;
      newView.fields.sourceData = sourceDataWithoutBoard;
      mutator.updateBlock(newView, dropdownView, 'reset Google view source');
      setViewMenuAnchorEl(null);
      resetGoogleForms.close();
    }
  }

  function handleRenameView() {
    setViewMenuAnchorEl(null);
    renameViewPopupState.open();
  }

  function handleViewOptions() {
    openViewOptions();
    setViewMenuAnchorEl(null);
  }

  function saveViewTitle(form: { title: string }) {
    if (dropdownView) {
      mutator.changeTitle(dropdownView.id, dropdownView.title, form.title);
      renameViewPopupState.close();
    }
  }

  async function reorderViews(droppedView: BoardView, dropzoneView: BoardView) {
    await mutator.changeBoardViewsOrder(board.id, viewIds, droppedView, dropzoneView);
  }

  const duplicateViewText = intl.formatMessage({
    id: 'View.DuplicateView',
    defaultMessage: 'Duplicate view'
  });
  const deleteViewText = intl.formatMessage({
    id: 'View.DeleteView',
    defaultMessage: 'Delete view'
  });

  // keep form title updated with dropdownView title
  useEffect(() => {
    setValue('title', dropdownView?.title || '');
  }, [dropdownView]);

  return (
    <>
      <Tabs
        // assign a key so that the tabs are remounted when the page change, otherwise the indicator will animate to the new tab
        key={viewsProp[0]?.id}
        textColor='primary'
        indicatorColor='secondary'
        value={activeShowViewId}
        sx={{ minHeight: 0, mb: '-6px' }}
      >
        {shownViews.map((view) => (
          <TabButton
            disableRipple
            key={view.id}
            href={activeView?.id === view.id ? undefined : getViewUrl(view.id)}
            onClick={handleViewClick}
            variant='text'
            size='small'
            id={view.id}
            sx={{ p: 0 }}
            value={view.id}
            label={
              <StyledTabContent
                color={activeView?.id === view.id ? 'textPrimary' : 'secondary'}
                display='flex'
                alignItems='center'
                fontSize='small'
                fontWeight={500}
                gap={1}
              >
                <span>
                  {iconForViewType(view.fields.viewType)}
                  {view.title || formatViewTitle(view)}
                </span>
              </StyledTabContent>
            }
          />
        ))}
        {restViews.length !== 0 && (
          <TabButton
            disableRipple
            sx={{ p: 0 }}
            {...showViewsTriggerState}
            label={
              <StyledTabContent color='secondary' fontSize='small' fontWeight={500}>
                <span>{restViews.length} more...</span>
              </StyledTabContent>
            }
          />
        )}
      </Tabs>
      <Menu anchorEl={viewMenuAnchorEl} open={Boolean(viewMenuAnchorEl)} onClose={closeViewMenu}>
        <MenuItem dense onClick={handleRenameView}>
          <ListItemIcon>
            <EditIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem dense onClick={handleViewOptions}>
          <ListItemIcon>
            <TuneIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Edit View</ListItemText>
        </MenuItem>
        {dropdownView?.fields.sourceType === 'google_form' && [
          <Divider key='divider' />,
          <MenuItem key='duplicate-view' dense onClick={resetGoogleForms.open}>
            <ListItemIcon>
              <RefreshIcon />
            </ListItemIcon>
            <ListItemText>Resync data with Google Forms</ListItemText>
          </MenuItem>,
          <Divider key='divider-2' />
        ]}
        {dropdownView &&
          dropdownView?.fields.sourceType !== 'google_form' && [
            <Divider key='divider' />,
            <MenuItem key='duplicate-view' dense onClick={handleDuplicateView}>
              <ListItemIcon>
                <DuplicateIcon />
              </ListItemIcon>
              <ListItemText>{duplicateViewText}</ListItemText>
            </MenuItem>
          ]}
        {views.length !== 1 && (
          <MenuItem dense onClick={handleDeleteView}>
            <ListItemIcon>
              <DeleteOutlineIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>{deleteViewText}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Menu {...showViewsMenuState}>
        {viewIds.map(
          (viewId) =>
            viewsRecord[viewId] && (
              <ViewMenuItem
                view={viewsRecord[viewId]}
                key={viewsRecord[viewId].id}
                href={disableUpdatingUrl ? '' : getViewUrl(viewsRecord[viewId].id)}
                onClick={() => {
                  showView(viewsRecord[viewId].id);
                  showViewsMenuState.onClose();
                }}
                onDrop={reorderViews}
              />
            )
        )}
        <Divider sx={{ my: 1 }} />
        <Box pl='14px'>
          {activeView && (
            <AddViewMenu
              board={board}
              activeView={activeView}
              views={views}
              showView={showView}
              showLabel={true}
              onClose={handleClose}
              onClickIcon={props.onClickNewView}
            />
          )}
        </Box>
      </Menu>
      <ConfirmDeleteModal
        title='Resync form and responses'
        onClose={resetGoogleForms.close}
        open={resetGoogleForms.isOpen}
        buttonText='Resync cards'
        question='This action will replace existing cards and properties including custom settings and cannot be undone. Continue?'
        onConfirm={resyncGoogleFormData}
      />

      {/* Form to rename views */}
      <Modal open={renameViewPopupState.isOpen} onClose={renameViewPopupState.close} title='Rename the view'>
        <form onSubmit={handleSubmit(saveViewTitle)}>
          <TextField {...register('title')} autoFocus />
          <Button type='submit'>Save</Button>
        </form>
      </Modal>
    </>
  );
}

export default injectIntl(ViewTabs);
