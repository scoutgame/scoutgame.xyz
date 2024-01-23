import type { PageMeta } from '@charmverse/core/pages';
import { ClickAwayListener, Collapse } from '@mui/material';
import { memo, useEffect, useState } from 'react';

import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView, IViewType } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';

import { DatabaseSidebarHeader } from './databaseSidebarHeader';
import { StyledSidebar } from './styledSidebar';
import GroupOptions from './viewGroupOptions';
import ViewLayoutOptions from './viewLayoutOptions';
import { ViewPropertyOption } from './viewPropertyOption';
import ViewPropertyOptions from './viewPropertyOptions';
import type { SidebarView } from './viewSidebarSelect';
import { ViewSidebarSelect } from './viewSidebarSelect';
import { ViewSourceOptions } from './viewSourceOptions/viewSourceOptions';

interface Props {
  board?: Board;
  rootBoard: Board; // we need the root board when creating or updating the view
  page?: PageMeta;
  view?: BoardView;
  views: BoardView[];
  closeSidebar: () => void;
  isOpen: boolean;
  groupByProperty?: IPropertyTemplate;
  pageId?: string;
  showView: (viewId: string) => void;
  hideLayoutOptions?: boolean;
  hideSourceOptions?: boolean;
  hideGroupOptions?: boolean;
  hideLayoutSelectOptions?: boolean;
  hidePropertiesRow?: boolean;
  supportedViewTypes?: IViewType[];
  cards: Card[];
}

function getDefaultView(hasBoardView: boolean): SidebarView {
  return hasBoardView ? 'view-options' : 'source';
}

function ViewSidebar(props: Props) {
  const [sidebarView, setSidebarView] = useState<SidebarView>(getDefaultView(!!props.view));
  const [selectedProperty, setSelectedProperty] = useState<null | IPropertyTemplate>(null);
  function goToSidebarHome() {
    setSidebarView('view-options');
  }

  useEffect(() => {
    // reset state on close
    if (!props.isOpen) {
      setSidebarView(getDefaultView(!!props.view));
    }
  }, [props.isOpen]);

  return (
    <ClickAwayListener mouseEvent={props.isOpen ? 'onMouseDown' : false} onClickAway={props.closeSidebar}>
      <Collapse
        in={props.isOpen}
        orientation='horizontal'
        sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 1000 }}
      >
        <StyledSidebar data-test='view-sidebar-content' className='disable-drag-selection'>
          {sidebarView === 'view-options' && <ViewSidebarSelect {...props} setSidebarView={setSidebarView} />}

          {props.view && (
            <>
              {sidebarView === 'layout' && (
                <>
                  <DatabaseSidebarHeader goBack={goToSidebarHome} title='Layout' onClose={props.closeSidebar} />
                  <ViewLayoutOptions
                    hideLayoutSelectOptions={props.hideLayoutSelectOptions}
                    board={props.board}
                    view={props.view}
                    supportedViewTypes={props.supportedViewTypes}
                  />
                </>
              )}
              {sidebarView === 'card-properties' && (
                <>
                  <DatabaseSidebarHeader goBack={goToSidebarHome} title='Properties' onClose={props.closeSidebar} />
                  <ViewPropertyOptions
                    setSelectedProperty={(property) => {
                      setSelectedProperty(property);
                      setSidebarView('card-property');
                    }}
                    properties={props.board?.fields.cardProperties ?? []}
                    view={props.view}
                  />
                </>
              )}
              {sidebarView === 'group-by' && (
                <>
                  <DatabaseSidebarHeader goBack={goToSidebarHome} title='Group by' onClose={props.closeSidebar} />
                  <GroupOptions
                    properties={props.board?.fields.cardProperties || []}
                    view={props.view}
                    groupByProperty={props.groupByProperty}
                  />
                </>
              )}
              {sidebarView === 'card-property' && selectedProperty && props.board && props.view && (
                <>
                  <DatabaseSidebarHeader
                    goBack={() => {
                      setSidebarView('card-properties');
                    }}
                    title='Edit property'
                    onClose={props.closeSidebar}
                  />
                  <ViewPropertyOption
                    goBackStep={() => {
                      setSidebarView('card-properties');
                    }}
                    views={props.views}
                    board={props.board}
                    view={props.view}
                    cards={props.cards}
                    property={selectedProperty}
                  />
                </>
              )}
            </>
          )}
          {sidebarView === 'source' && (
            <ViewSourceOptions
              rootBoard={props.rootBoard}
              title='Data source'
              view={props.view}
              views={props.views}
              // We don't want to allow going back if this board is locked to charmverse databases
              closeSourceOptions={goToSidebarHome}
              closeSidebar={props.closeSidebar}
              showView={props.showView}
            />
          )}
        </StyledSidebar>
      </Collapse>
    </ClickAwayListener>
  );
}

export default memo(ViewSidebar);
