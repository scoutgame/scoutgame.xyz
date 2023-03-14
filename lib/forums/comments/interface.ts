import type { PostComment } from '@prisma/client';

import type { PageContent } from 'lib/prosemirror/interfaces';

export type PostCommentWithVote = PostComment & {
  upvotes: number;
  downvotes: number;
  upvoted: null | boolean;
};

export type PostCommentWithVoteAndChildren = PostCommentWithVote & {
  children: PostCommentWithVoteAndChildren[];
};

export type CreatePostCommentInput = {
  content: PageContent;
  contentText: string;
  parentId?: string;
};

export type UpdatePostCommentInput = {
  content: PageContent;
  contentText: string;
};

export type PostCommentVote = { upvotes: number; downvotes: number; upvoted: boolean | null };
