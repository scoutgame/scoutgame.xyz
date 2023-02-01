import type { Post } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createForumPost, trackCreateForumPostEvent } from 'lib/forums/posts/createForumPost';
import type { ListForumPostsRequest, PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import { listForumPosts } from 'lib/forums/posts/listForumPosts';
import { onError, onNoMatch, requireKeys, requireSpaceMembership } from 'lib/middleware';
import { mutatePostCategorySearch } from 'lib/permissions/forum/mutatePostCategorySearch';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'spaceId' }))
  .get(requireKeys<ListForumPostsRequest>(['spaceId'], 'query'), getPosts)
  .post(createForumPostController);

// TODO - Update posts
async function getPosts(req: NextApiRequest, res: NextApiResponse<PaginatedPostList>) {
  const postQuery = req.query as any as ListForumPostsRequest;
  const userId = req.session.user.id;

  // Apply permissions to what we are searching for
  postQuery.categoryId = (
    await mutatePostCategorySearch({ spaceId: postQuery.spaceId, categoryId: postQuery.categoryId, userId })
  ).categoryId;

  const posts = await listForumPosts(postQuery, userId);

  return res.status(200).json(posts);
}

async function createForumPostController(req: NextApiRequest, res: NextApiResponse<Post>) {
  const createdPost = await createForumPost({ ...req.body, createdBy: req.session.user.id });

  relay.broadcast(
    {
      type: 'post_published',
      payload: {
        createdBy: createdPost.createdBy,
        categoryId: createdPost.categoryId
      }
    },
    createdPost.spaceId
  );

  await trackCreateForumPostEvent({
    post: createdPost,
    userId: req.session.user.id
  });

  return res.status(201).json(createdPost);
}

export default withSessionRoute(handler);
