import React, { forwardRef, ReactNode, ComponentProps, useCallback, useMemo, useState, useEffect, Dispatch, SetStateAction, SyntheticEvent } from 'react';
import styled from '@emotion/styled';
import { useDrop, useDrag, DragSourceMonitor, DndProvider } from 'react-dnd';
import { useRouter } from 'next/router';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TreeView from '@mui/lab/TreeView';
import TreeItem, { treeItemClasses } from '@mui/lab/TreeItem';
import Link from 'next/link';
import MuiLink from '@mui/material/Link';
import { Page } from 'models';
import { useLocalStorage } from 'hooks/useLocalStorage';
import EmojiCon from '../Emoji';

// based off https://codesandbox.io/s/dawn-resonance-pgefk?file=/src/Demo.js

export type MenuNode = Page & {
  children: MenuNode[];
}

const StyledTreeItemRoot = styled(TreeItem)(({ theme }) => ({
  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    // paddingRight: theme.spacing(1),
    // fontWeight: theme.typography.fontWeightMedium,
    '&.Mui-expanded': {
      fontWeight: theme.typography.fontWeightRegular
    },
    // '&:hover': {
    //   backgroundColor: theme.palette.action.hover
    // },
    '&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused': {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
      color: 'var(--tree-view-color)'
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: 'inherit',
      color: 'inherit'
    }
    // [`& .${treeItemClasses.iconContainer}`]: {
    // }
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 0,
    [`& .${treeItemClasses.content}`]: {
      paddingLeft: theme.spacing(3)
    }
  }
}));

type TreeItemProps = ComponentProps<typeof TreeItem> & {
  href: string;
  labelIcon?: string;
}

const StyledTreeItemContent = styled.a`
  color: inherit;
  text-decoration: none;
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(0.5)} 0;
`;

const StyledLink = styled(Typography)`
  color: inherit;
  font-size: 14px;
  font-weight: 500;
  &:hover {
    color: inherit;
  }
`;

// eslint-disable-next-line react/function-component-definition
const StyledTreeItem = forwardRef((props: TreeItemProps, ref) => {
  const {
    color,
    href,
    labelIcon,
    label,
    ...other
  } = props;

  function onClick (event: SyntheticEvent) {
    event.stopPropagation();
  }

  return (
    <StyledTreeItemRoot
      label={(
        <Link href={href} passHref>
          <StyledTreeItemContent onClick={onClick}>
            <EmojiCon sx={{ display: 'inline-block', color: 'black', width: 24 }}>
              {labelIcon || '📄 '}
            </EmojiCon>
            <StyledLink>
              {label}
            </StyledLink>
          </StyledTreeItemContent>
        </Link>
      )}
      {...other}
      ref={ref}
    />
  );
});

// pulled from react-merge-refs
function mergeRefs (refs: any) {
  return (value: any) => {
    refs.forEach((ref: any) => {
      if (typeof ref === 'function') {
        ref(value);
      }
      else if (ref != null) {
        ref.current = value;
      }
    });
  };
}

function RenderDraggableNode ({ item, onDrop, pathPrefix }:
  { item: MenuNode, onDrop: (a: MenuNode, b: MenuNode) => void, pathPrefix: string }) {
  // rgba(22, 52, 71, 0.08)
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: 'item',
    item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId()
    })
  }));
  const [{ canDrop, isOverCurrent }, drop] = useDrop(() => ({
    accept: 'item',
    drop (droppedItem: MenuNode, monitor) {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }
      onDrop(droppedItem, item);
    },
    collect: monitor => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop()
    })
  }));

  const focusListener = useCallback(elt => {
    elt?.addEventListener('focusin', (e: any) => {
      // Disable Treeview focus system which make draggable on TreeIten unusable
      // see https://github.com/mui-org/material-ui/issues/29518
      e.stopImmediatePropagation();
    });
    drag(elt);
  }, [drag]);

  const isActive = canDrop && isOverCurrent;
  return (
    <StyledTreeItem
      ref={mergeRefs([drag, drop, dragPreview, focusListener])}
      key={item.id}
      nodeId={item.id}
      label={item.title}
      href={`${pathPrefix}/${item.path}`}
      labelIcon={item.icon}
      sx={{
        backgroundColor: isActive ? 'rgba(22, 52, 71, 0.08)' : 'unset'
      }}
    >
      {isDragging
        ? null
        : item.children?.length > 0
          ? item.children.map((childItem, index) => (
            <RenderDraggableNode
              onDrop={onDrop}
              pathPrefix={pathPrefix}
              key={childItem.id}
              item={childItem}
            />
          ))
          : null}
    </StyledTreeItem>
  );
}

function mapTree (items: Page[], key: 'parentId'): MenuNode[] {
  const tempItems = items.map(item => {
    return {
      ...item,
      children: []
    };
  });
  const map: { [key: string]: number } = {};
  let node: MenuNode;
  const roots = [];
  let i: number;
  for (i = 0; i < tempItems.length; i += 1) {
    map[tempItems[i].id] = i; // initialize the map
  }
  for (i = 0; i < tempItems.length; i += 1) {
    node = tempItems[i];
    const index = node[key] ? map[node[key]!] : -1;
    if (node[key] && tempItems[index]) {
      // @ts-ignore if you have dangling branches check that map[node.parentId] exists
      tempItems[index].children.push(node);
    }
    else {
      roots.push(node);
    }
  }
  return roots;
}

type TreeRootProps = {
  children: ReactNode,
  setPages: Dispatch<SetStateAction<Page[]>>
} & ComponentProps<typeof TreeView>;

function TreeRoot ({ children, setPages, ...rest }: TreeRootProps) {
  const [{ canDrop, isOverCurrent }, drop] = useDrop(() => ({
    accept: 'item',
    drop (item: MenuNode, monitor) {
      const didDrop = monitor.didDrop();
      if (didDrop || !item.parentId) {
        return;
      }
      setPages((stateNodes) => stateNodes.map((stateNode) => {
        if (stateNode.id === item.id) {
          return {
            ...stateNode,
            parentId: null
          };
        }
        else {
          return stateNode;
        }
      }));
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop()
    })
  }));
  const isActive = canDrop && isOverCurrent;
  return (
    <div
      ref={drop}
      style={{
        backgroundColor: isActive ? 'rgba(22, 52, 71, 0.08)' : 'unset',
        flexGrow: 1
      }}
    >
      <TreeView {...rest}>{children}</TreeView>
    </div>
  );
}

export default function PageNavigation ({ pages, setPages, pathPrefix }:
    { pages: Page[], setPages: Dispatch<SetStateAction<Page[]>>, pathPrefix: string }) {

  const [expanded, setExpanded] = useLocalStorage<string[]>('expanded-pages', []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const mappedItems = useMemo(() => mapTree(pages, 'parentId'), [pages]);
  const onDrop = (droppedItem: MenuNode, containerItem: MenuNode) => {
    setPages(stateNodes => stateNodes.map(stateNode => {
      if (stateNode.id === droppedItem.id) {
        return {
          ...stateNode,
          parentId: containerItem.id
        };
      }
      else {
        return stateNode;
      }
    }));
  };
  const router = useRouter();
  const expandedNodeIds = new Set<string>();
  useEffect(() => {
    for (const page of pages) {
      if (router.asPath === `${pathPrefix}/${page.path}`) {
        // expand the parent of the active page
        if (page.parentId) {
          expandedNodeIds.add(page.parentId);
          if (!expanded.includes(page.parentId)) {
            setExpanded(expanded.concat(page.parentId));
          }
        }
        if (!selectedNodeId) {
          setSelectedNodeId(page.id);
        }
      }
    }
  }, []);

  function onNodeToggle (event: SyntheticEvent, nodeIds: string[]) {
    setExpanded(nodeIds);
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <TreeRoot
        setPages={setPages}
        expanded={expanded}
        selected={selectedNodeId}
        onNodeToggle={onNodeToggle}
        aria-label='items navigator'
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        sx={{ flexGrow: 1, width: '100%', overflowY: 'auto' }}
      >
        {mappedItems.map((item, index) => (
          <RenderDraggableNode key={item.id} item={item} onDrop={onDrop} pathPrefix={pathPrefix} />
        ))}
      </TreeRoot>
    </DndProvider>
  );
}
