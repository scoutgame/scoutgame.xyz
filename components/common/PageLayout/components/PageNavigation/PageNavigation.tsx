import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ExpandMoreIcon from '@mui/icons-material/ArrowDropDown'; // ExpandMore
import ChevronRightIcon from '@mui/icons-material/ArrowRight'; // ChevronRight
import TreeView from '@mui/lab/TreeView';
import type { Page } from '@prisma/client';
import { useRouter } from 'next/router';
import type { ComponentProps, ReactNode, SyntheticEvent } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDrop } from 'react-dnd';

import charmClient from 'charmClient';
import { NavIconHover } from 'components/common/PageLayout/components/PageNavigation/components/NavIconHover';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { IPageWithPermissions, NewPageInput, PageMeta, PageUpdates } from 'lib/pages';
import { addPageAndRedirect } from 'lib/pages';
import { mapPageTree, sortNodes } from 'lib/pages/mapPageTree';
import { isTruthy } from 'lib/utilities/types';

import type { MenuNode, ParentMenuNode } from './components/TreeNode';
import TreeNode from './components/TreeNode';

const StyledTreeRoot = styled(TreeRoot)<{ isFavorites?: boolean }>`
  flex-grow: ${(props) => (props.isFavorites ? 0 : 1)};
  width: 100%;
  overflow-y: auto;
`;

export function filterVisiblePages(pages: (PageMeta | undefined)[], rootPageIds: string[] = []) {
  return pages.filter((page): page is IPageWithPermissions =>
    isTruthy(
      page &&
        (page.type === 'board' ||
          page.type === 'page' ||
          page.type === 'linked_board' ||
          rootPageIds?.includes(page.id))
    )
  );
}

type TreeRootProps = {
  children: ReactNode;
  isFavorites?: boolean;
  mutatePage: (page: PageUpdates) => void;
} & ComponentProps<typeof TreeView>;

function TreeRoot({ children, mutatePage, isFavorites, ...rest }: TreeRootProps) {
  const [{ canDrop, isOverCurrent }, drop] = useDrop<MenuNode, any, { canDrop: boolean; isOverCurrent: boolean }>(
    () => ({
      accept: 'item',
      drop(item, monitor) {
        const didDrop = monitor.didDrop();
        if (didDrop || !item.parentId) {
          return;
        }

        mutatePage({ id: item.id, parentId: null });
      },
      collect: (monitor) => ({
        isOverCurrent: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop()
      })
    })
  );
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const theme = useTheme();
  const isActive = canDrop && isOverCurrent;

  // Need to wait for the child nodes to appear before we can start scrolling
  const hasChildrenLoaded = !!(children as any[]).length;

  useEffect(() => {
    const { pageId } = router.query;
    if (hasChildrenLoaded && pageId) {
      const anchor = document.querySelector(`a[href^="/${router.query.domain}/${pageId}"]`);
      if (anchor) {
        setTimeout(() => {
          anchor.scrollIntoView({
            behavior: 'smooth'
          });
        });
      }
    }
  }, [hasChildrenLoaded]);

  return (
    <div
      ref={drop}
      style={{
        backgroundColor: isActive ? theme.palette.action.focus : 'unset',
        flexGrow: isFavorites ? 0 : 1
      }}
    >
      <TreeView {...rest} ref={ref}>
        {children}
      </TreeView>
    </div>
  );
}

type PageNavigationProps = {
  deletePage?: (id: string) => void;
  isFavorites?: boolean;
  rootPageIds?: string[];
  onClick?: () => void;
};

function PageNavigation({ deletePage, isFavorites, rootPageIds, onClick }: PageNavigationProps) {
  const router = useRouter();
  const { pages, currentPageId, setPages, mutatePage } = usePages();
  const space = useCurrentSpace();
  const { user } = useUser();
  const [expanded, setExpanded] = useLocalStorage<string[]>(`${space?.id}.expanded-pages`, []);
  const { showMessage } = useSnackbar();
  const pagesArray: MenuNode[] = filterVisiblePages(Object.values(pages)).map(
    (page): MenuNode => ({
      id: page.id,
      title: page.title,
      icon: page.icon,
      index: page.index,
      isEmptyContent: !page.hasContent,
      parentId: page.parentId,
      path: page.path,
      type: page.type,
      createdAt: page.createdAt,
      deletedAt: page.deletedAt,
      spaceId: page.spaceId
    })
  );

  const pageHash = JSON.stringify(pagesArray);

  const mappedItems = useMemo(() => {
    return mapPageTree<MenuNode>({ items: pagesArray, rootPageIds });
  }, [pageHash, rootPageIds]);

  const onDropAdjacent = useCallback((droppedItem: ParentMenuNode, containerItem: MenuNode) => {
    if (droppedItem.id === containerItem?.id) {
      return;
    }

    const parentId = containerItem.parentId;

    setPages((_pages) => {
      const unsortedSiblings = Object.values(_pages)
        .filter(isTruthy)
        .filter((page) => page && page.parentId === parentId && page.id !== droppedItem.id);
      const siblings = sortNodes(unsortedSiblings);

      const droppedPage = _pages[droppedItem.id];
      if (!droppedPage) {
        throw new Error('canot find dropped page');
      }
      const originIndex: number = siblings.findIndex((sibling) => sibling.id === containerItem.id);
      siblings.splice(originIndex, 0, droppedPage);
      siblings.forEach((page, _index) => {
        page.index = _index;
        page.parentId = parentId;
        charmClient.pages.updatePage({
          id: page.id,
          index: _index,
          parentId
        });
      });
      siblings.forEach((page) => {
        const currentPage = _pages[page.id];
        if (currentPage) {
          _pages[page.id] = {
            ...currentPage,
            index: page.index,
            parentId: page.parentId
          };
        }
      });
      return { ..._pages };
    });
  }, []);

  const onDropChild = useCallback(
    (droppedItem: MenuNode, containerItem: MenuNode) => {
      if (containerItem.type.match(/board/)) {
        return;
      }

      // Prevent a page becoming child of itself
      if (droppedItem.id === containerItem?.id) {
        return;
      }

      // Make sure the new parent is not in the children of this page
      let currentNode: MenuNode | undefined = containerItem;
      while (currentNode) {
        if (currentNode.parentId === droppedItem.id) {
          return;
        }
        // We reached the current node. It's fine to reorder under a parent or root
        else if (currentNode.id === droppedItem.id || !currentNode.parentId) {
          break;
        } else {
          currentNode = pages[currentNode.parentId];
        }
      }

      const index = 1000; // send it to the end
      const parentId = (containerItem as MenuNode)?.id ?? null;

      mutatePage({ id: droppedItem.id, parentId });

      charmClient.pages
        .updatePage({
          id: droppedItem.id,
          index, // send it to the end
          parentId
        })
        .catch((err) => {
          showMessage(err.message, 'error');
        });
    },
    [pages]
  );

  useEffect(() => {
    const currentPage = pages[currentPageId];
    // expand the parent of the active page
    if (currentPage?.parentId && !isFavorites) {
      if (!expanded?.includes(currentPage.parentId) && currentPage.type !== 'card') {
        setExpanded(expanded?.concat(currentPage.parentId) ?? []);
      }
    }
  }, [currentPageId, pages, isFavorites]);

  function onNodeToggle(event: SyntheticEvent, nodeIds: string[]) {
    setExpanded(nodeIds);
  }

  let selectedNodeId: string | null = null;
  if (currentPageId) {
    selectedNodeId = currentPageId;
    if (typeof router.query.viewId === 'string') {
      selectedNodeId = router.query.viewId;
    }
  }

  const addPage = useCallback(
    (page: Partial<Page>) => {
      if (space && user) {
        const newPage: NewPageInput = {
          ...page,
          createdBy: user.id,
          spaceId: space.id
        };
        return addPageAndRedirect(newPage, router);
      }
    },
    [space?.id, user?.id]
  );

  return (
    <StyledTreeRoot
      mutatePage={mutatePage}
      expanded={expanded ?? []}
      // @ts-ignore - we use null instead of undefined to control the element
      selected={selectedNodeId}
      onNodeToggle={onNodeToggle}
      aria-label='items navigator'
      defaultCollapseIcon={
        <NavIconHover
          width={{ xs: 30, md: 24 }}
          height={{ xs: 30, md: 24 }}
          display='flex'
          alignItems='center'
          justifyContent='center'
        >
          <ExpandMoreIcon fontSize='large' />
        </NavIconHover>
      }
      defaultExpandIcon={
        <NavIconHover
          width={{ xs: 30, md: 24 }}
          height={{ xs: 30, md: 24 }}
          display='flex'
          alignItems='center'
          justifyContent='center'
        >
          <ChevronRightIcon fontSize='large' />
        </NavIconHover>
      }
      isFavorites={isFavorites}
    >
      {mappedItems.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          onDropChild={onDropChild}
          onDropAdjacent={onDropAdjacent}
          pathPrefix={`/${router.query.domain}`}
          // pass down so parent databases can highlight themselves
          selectedNodeId={selectedNodeId}
          addPage={addPage}
          deletePage={deletePage}
          onClick={onClick}
        />
      ))}
    </StyledTreeRoot>
  );
}

export default memo(PageNavigation);
