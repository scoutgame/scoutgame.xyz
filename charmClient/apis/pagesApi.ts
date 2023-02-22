import type { Page, PageComment, ProfileItem } from '@prisma/client';

import * as http from 'adapters/http';
import type { CreateCommentInput, UpdateCommentInput } from 'lib/comments';
import type { IPageWithPermissions, PageDetails, PageMeta } from 'lib/pages';
import type { PageCommentWithVote } from 'lib/pages/comments/interface';

export interface UpdateProfileItemRequest {
  profileItems: Omit<ProfileItem, 'userId'>[];
}

export class PagesApi {
  getPages(spaceId: string) {
    // meta=true - TEMP param to keep backward compatibility with old clients
    return http.GET<PageMeta[]>(`/api/spaces/${spaceId}/pages`, { meta: true });
  }

  searchPages(spaceId: string, search: string) {
    // meta=true - TEMP param to keep backward compatibility with old clients
    return http.GET<PageMeta[]>(`/api/spaces/${spaceId}/pages`, { meta: true, search });
  }

  getPage(pageIdOrPath: string, spaceId?: string) {
    const query = spaceId ? `?spaceId=${spaceId}` : '';
    return http.GET<IPageWithPermissions>(`/api/pages/${pageIdOrPath}${query}`);
  }

  updatePage(pageOpts: Partial<Page>) {
    return http.PUT<IPageWithPermissions>(`/api/pages/${pageOpts.id}`, pageOpts);
  }

  getPageDetails(pageIdOrPath: string, spaceId?: string) {
    const query = spaceId ? `?spaceId=${spaceId}` : '';
    return http.GET<PageDetails>(`/api/pages/${pageIdOrPath}/details${query}`);
  }

  convertToProposal(pageId: string) {
    return http.POST<PageDetails>(`/api/pages/${pageId}/convert-to-proposal`);
  }

  listComments(pageId: string): Promise<PageCommentWithVote[]> {
    return http.GET(`/api/pages/${pageId}/comments`);
  }

  createComment({ pageId, comment }: { pageId: string; comment: CreateCommentInput }): Promise<PageCommentWithVote> {
    return http.POST(`/api/pages/${pageId}/comments`, comment);
  }

  updateComment({
    pageId,
    id,
    content,
    contentText
  }: UpdateCommentInput & { pageId: string; id: string }): Promise<PageComment> {
    return http.PUT(`/api/pages/${pageId}/comments/${id}`, { content, contentText });
  }

  deleteComment({ commentId, pageId }: { pageId: string; commentId: string }): Promise<void> {
    return http.DELETE(`/api/pages/${pageId}/comments/${commentId}`);
  }

  voteComment({ pageId, upvoted, commentId }: { commentId: string; upvoted: boolean | null; pageId: string }) {
    return http.PUT(`/api/pages/${pageId}/comments${commentId}/vote`, { upvoted });
  }
}
