import { prisma } from '@charmverse/core';
import type { Comment } from '@charmverse/core/dist/prisma';

import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';

import type { CommentCreate } from './interfaces';

export async function addComment({ content, threadId, userId }: CommentCreate): Promise<Comment> {
  if (!content) {
    throw new InvalidInputError('Please provide non-empty content to create a comment');
  }

  const thread = await prisma.thread.findUnique({
    where: {
      id: threadId
    },
    include: {
      user: true,
      page: true
    }
  });

  if (!thread) {
    throw new DataNotFoundError(`Thread with id ${threadId} not found`);
  }

  if (!thread.page) {
    throw new DataNotFoundError(`Linked page for ${threadId} not found`);
  }

  const createdComment = await prisma.comment.create({
    data: {
      content: content as any,
      thread: {
        connect: {
          id: threadId
        }
      },
      user: {
        connect: {
          id: userId
        }
      },
      space: {
        connect: {
          id: thread.spaceId
        }
      },
      page: {
        connect: {
          id: thread.pageId
        }
      }
    }
  });

  return createdComment;
}
