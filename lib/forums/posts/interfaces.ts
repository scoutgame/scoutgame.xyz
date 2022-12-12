import type { Page, Post } from '@prisma/client';

import type { PageMeta } from 'lib/pages';

export type ForumPostContent = {
  type: 'text' | 'image';
  content: string;
};
export type ForumPostPageVote = { upvotes: number; downvotes: number; upvoted?: boolean };
export type ForumPostPage = Page & { post: Post & ForumPostPageVote };
export type ForumPostPageWithoutVote = PageMeta & { post: Post };
