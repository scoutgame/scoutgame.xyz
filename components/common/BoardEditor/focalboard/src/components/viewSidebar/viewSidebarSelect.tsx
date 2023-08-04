import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GroupIcon from '@mui/icons-material/GroupWorkOutlined';
import ArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PreviewIcon from '@mui/icons-material/Preview';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import type { IconProps } from '@mui/material';
import { ListItemIcon, ListItemText, MenuItem, Typography } from '@mui/material';
import type { OverridableComponent } from '@mui/material/OverridableComponent';
import type { SvgIconTypeMap } from '@mui/material/SvgIcon';
import { capitalize } from 'lodash';
import { FcGoogle } from 'react-icons/fc';
import type { IconType } from 'react-icons/lib';
import { RiFolder2Line } from 'react-icons/ri';

import {
  LinkedIcon,
  PageIcon,
  StyledDatabaseIcon,
  StyledPageIcon
} from 'components/common/PageLayout/components/PageIcon';
import { usePages } from 'hooks/usePages';
import type { Board, DataSourceType, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';

import { DatabaseSidebarHeader } from './databaseSidebarHeader';

export type SidebarView = 'view-options' | 'layout' | 'card-properties' | 'group-by' | 'source';

export const initialSidebarState: SidebarView = 'view-options';

function MenuRow({
  icon,
  title,
  value,
  onClick
}: {
  icon: JSX.Element;
  title: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <MenuItem dense onClick={onClick}>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText>{title}</ListItemText>
      <Typography
        component='div'
        color='secondary'
        variant='body2'
        sx={{
          flexGrow: 1,
          maxWidth: '45%',
          textAlign: 'right',
          whitespace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {value}
      </Typography>
      <ArrowRightIcon color='secondary' />
    </MenuItem>
  );
}

type Props = {
  setSidebarView: (view: SidebarView) => void;
  closeSidebar: () => void;
  view?: BoardView;
  board?: Board;
  groupByProperty?: IPropertyTemplate;
};

type SourceIconType = DataSourceType | 'linked';

type SourceIconProps = {
  sourceType: SourceIconType;
};

function SourceIcon({ sourceType }: SourceIconProps) {
  const style = { color: 'var(--secondary-text)' };

  if (sourceType === 'proposals') {
    return <TaskOutlinedIcon style={style} />;
  } else if (sourceType === 'google_form') {
    return <FcGoogle style={style} />;
  } else if (sourceType === 'linked') {
    return <PageIcon pageType='linked_board' />;
  } else {
    return <RiFolder2Line style={style} />;
  }
}

export function ViewSidebarSelect({ setSidebarView, closeSidebar, view, board, groupByProperty }: Props) {
  const { pages } = usePages();

  const withGroupBy = view?.fields.viewType.match(/board/) || view?.fields.viewType === 'table';
  const currentGroup = board?.fields.cardProperties.find((prop) => prop.id === groupByProperty?.id)?.name;
  const currentLayout = view?.fields.viewType;
  const visiblePropertyIds = view?.fields.visiblePropertyIds ?? [];
  const currentProperties = visiblePropertyIds.filter((id) =>
    board?.fields.cardProperties.some((c) => c.id === id)
  ).length;

  let sourceTitle = 'Database';

  let sourceIconType: SourceIconType = 'board_page';

  const linkedSourcePage = view && pages ? pages[view.fields.linkedSourceId ?? ''] : undefined;
  if (linkedSourcePage) {
    sourceTitle = linkedSourcePage.title;
    sourceIconType = 'linked';
  } else if (view?.fields.sourceType === 'google_form') {
    sourceTitle = view?.fields.sourceData?.formName ?? 'Google Form';
    sourceIconType = 'google_form';
  } else if (board?.fields.sourceType === 'proposals') {
    sourceTitle = 'Proposals';
    sourceIconType = 'proposals';
  }

  return (
    <>
      <DatabaseSidebarHeader title='View options' onClose={closeSidebar} />
      <MenuRow
        onClick={() => setSidebarView('layout')}
        icon={<PreviewIcon color='secondary' />}
        title='Layout'
        value={capitalize(currentLayout)}
      />
      <MenuRow
        onClick={() => setSidebarView('card-properties')}
        icon={<FormatListBulletedIcon color='secondary' />}
        title='Properties'
        value={currentProperties > 0 ? `${currentProperties} shown` : 'None'}
      />
      {withGroupBy && (
        <MenuRow
          onClick={() => setSidebarView('group-by')}
          icon={<GroupIcon color='secondary' />}
          title='Group'
          value={currentGroup ?? 'None'}
        />
      )}

      <MenuRow
        onClick={() => setSidebarView('source')}
        icon={<SourceIcon sourceType={sourceIconType} />}
        title='Source'
        value={sourceTitle}
      />
    </>
  );
}
