import { PageNotFoundError } from 'next/dist/shared/lib/utils';

import { prisma } from 'db';

import { getForumPost } from './getForumPost';

export async function voteForumPost({
  upvoted,
  userId,
  pageId
}: {
  pageId: string;
  userId: string;
  upvoted: boolean | null;
}) {
  const page = await getForumPost({ pageId, userId });

  if (!page || !page.post) {
    throw new PageNotFoundError(pageId);
  }

  if (upvoted === null) {
    await prisma.pageUpDownVote.delete({
      where: {
        createdBy_pageId: {
          createdBy: userId,
          pageId
        }
      }
    });
  } else {
    await prisma.pageUpDownVote.upsert({
      create: {
        createdBy: userId,
        upvoted,
        pageId
      },
      update: {
        upvoted
      },
      where: {
        createdBy_pageId: {
          createdBy: userId,
          pageId
        }
      }
    });
  }
}
