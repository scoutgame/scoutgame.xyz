import { Prisma } from '@prisma/client';
import charmClient from 'charmClient';
import { PageLayout } from 'components/common/page-layout';
import { DatabaseEditor } from 'components/databases';
import Editor from 'components/editor';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import debouncePromise from 'lib/utilities/debouncePromise';
import { Page } from 'models';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useMemo, useState, useCallback } from 'react';
import ErrorPage from 'components/common/errors/ErrorPage';
import log from 'lib/log';
import { IPagePermissionFlags } from 'lib/permissions/pages';
import { isTruthy } from 'lib/utilities/types';
import { useUser } from 'hooks/useUser';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

/**
 * @viewId - Enforce a specific view inside the nested blocks editor
 */
interface IBlocksEditorPage {
  publicShare?: boolean
}

export default function BlocksEditorPage ({ publicShare = false }: IBlocksEditorPage) {

  const { currentPageId, setIsEditing, pages, setPages, setCurrentPageId } = usePages();
  const router = useRouter();
  const pageId = router.query.pageId as string;
  const [, setTitleState] = usePageTitle();
  const [pageNotFound, setPageNotFound] = useState(false);

  const [user] = useUser();
  const [space] = useCurrentSpace();

  const [pagePermissions, setPagePermissions] = useState<Partial<IPagePermissionFlags>>({});

  const debouncedPageUpdate = useMemo(() => {
    return debouncePromise((input: Prisma.PageUpdateInput) => {
      setIsEditing(true);
      return charmClient.updatePage(input);
    }, 500);
  }, []);

  const setPage = useCallback(async (updates: Partial<Page>) => {
    if (!currentPageId || publicShare === true) {
      return;
    }
    setPages((_pages) => ({
      ..._pages,
      [currentPageId]: {
        ..._pages[currentPageId],
        ...updates
      }
    }));
    if (updates.hasOwnProperty('title')) {
      setTitleState(updates.title || 'Untitled');
    }
    debouncedPageUpdate({ id: currentPageId, ...updates } as Prisma.PageUpdateInput)
      .catch((err: any) => {
        log.error('Error saving page', err);
      })
      .finally(() => {
        setIsEditing(false);
      });
  }, [currentPageId, publicShare]);

  async function loadPublicPage (publicPageId: string) {
    const page = await charmClient.getPublicPage(publicPageId);
    setTitleState(page.title);
    setCurrentPageId(page.id);
    setPages({
      [page.id]: page
    });
  }

  const pagesLoaded = Object.keys(pages).length > 0;

  useEffect(() => {
    if (publicShare === true && pageId) {
      loadPublicPage(pageId as string);
    }
    else if (pageId && pagesLoaded) {
      const pageByPath = pages[pageId] || Object.values(pages).find(page => page.path === pageId);
      if (pageByPath) {
        setTitleState(pageByPath.title);
        setCurrentPageId(pageByPath.id);
      }
      else {
        setPageNotFound(true);
      }
    }
  }, [pageId, pagesLoaded]);

  // memoize the page to avoid re-rendering unless certain fields are changed
  const currentPage = pages[currentPageId];
  const memoizedCurrentPage = useMemo(
    () => pages[currentPageId],
    [currentPageId, currentPage?.headerImage, currentPage?.icon, currentPage?.title]
  );

  useEffect(() => {
    console.log('Use effect fired');
    if (user && memoizedCurrentPage) {
      charmClient.queryPermissions({
        userId: user.id,
        pageId: memoizedCurrentPage.id
      } as any)
        .then(permissions => {
          console.log('Found permissions', permissions);
          setPagePermissions(permissions);
        });
    }
  }, [user, memoizedCurrentPage]);

  const canEdit = !publicShare && pagePermissions?.edit_content === true;

  if (pageNotFound) {
    return <ErrorPage message={'Sorry, that page doesn\'t exist'} />;
  }
  else if (!memoizedCurrentPage) {
    return null;
  }
  else if (currentPage.type === 'board') {
    return <DatabaseEditor page={memoizedCurrentPage} setPage={setPage} readonly={publicShare} />;
  }
  else {
    return (
      <Editor
        page={memoizedCurrentPage}
        setPage={setPage}
        readOnly={!canEdit}
      />
    );
  }
}

BlocksEditorPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
