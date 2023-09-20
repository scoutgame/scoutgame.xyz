import type { PageComment, PageCommentVote } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { InvalidStateError, requireKeys } from 'lib/middleware';
import { generatePageQuery } from 'lib/pages/server/generatePageQuery';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';
import { apiHandler } from 'lib/public-api/handler';
import { withSessionRoute } from 'lib/session/withSession';

const handler = apiHandler();

handler.get(getProposalComments);
handler.post(requireKeys(['userId', 'content'], 'body'), createProposalComment);

/**
 * @swagger
 * components:
 *   schemas:
 *     ProposalComment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *         parentId:
 *           type: string
 *           nullable: true
 *           description: Parent comment
 *           example: null
 *         content:
 *           type: object
 *           properties:
 *             text:
 *               type: string
 *               example: "This is a comment."
 *             markdown:
 *               type: string
 *               example: "## This is a comment."
 *         createdBy:
 *           type: string
 *           description: User ID of the user who created the comment
 *           example: "69a54a56-50d6-4f7b-b350-2d9c312f81f3"
 *         createdAt:
 *           type: string
 *           description: ISO Timestamp of comment creation date
 *           example: '2023-09-20T01:37:24.262Z'
 *         upvotes:
 *           type: integer
 *           example: 5
 *         downvotes:
 *           type: integer
 *           example: 2
 *         children:
 *           type: array
 *           description: Child comments of this comment. By default, this array is empty unless you request comments as a tree
 *           items:
 *             $ref: '#/components/schemas/ProposalComment'
 *             example:
 *               id: "4ba85f64-5717-4562-b3fc-2c963f66afa7"
 *               parentId: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               content:
 *                 text: "This is a child comment."
 *                 markdown: "### This is a child comment."
 *               createdBy: "79a54a56-50d6-4f7b-b350-2d9c312f81f4"
 *               upvotes: 3
 *               downvotes: 1
 *               children: []
 *
 */
export type PublicApiProposalComment = {
  id: string;
  createdBy: string;
  createdAt: string;
  parentId: string | null;
  content: {
    text: string;
    markdown: string;
  };
  upvotes: number;
  downvotes: number;
  children: PublicApiProposalComment[];
};

async function mapReducePageComments({
  comments,
  reduceToTree
}: {
  comments: (Pick<PageComment, 'id' | 'parentId' | 'content' | 'contentText' | 'createdAt' | 'createdBy'> & {
    votes: Pick<PageCommentVote, 'upvoted'>[];
  })[];
  reduceToTree?: boolean;
}): Promise<PublicApiProposalComment[]> {
  const mappedComments: Record<string, PublicApiProposalComment> = {};

  const rootComments: PublicApiProposalComment[] = [];

  // Map comments to correct shape
  for (const comment of comments) {
    const { upvotes, downvotes } = comment.votes.reduce(
      (acc, val) => {
        if (val.upvoted) {
          acc.upvotes += 1;
        } else if (val.upvoted === false) {
          acc.downvotes += 1;
        }
        return acc;
      },
      { upvotes: 0, downvotes: 0 }
    );

    const parsedContent = await generateMarkdown({
      content: comment.content
    });

    const commentWithDetails: PublicApiProposalComment = {
      id: comment.id,
      createdBy: comment.createdBy,
      createdAt: comment.createdAt.toISOString(),
      parentId: comment.parentId,
      content: {
        markdown: parsedContent,
        text: comment.contentText
      },
      upvotes,
      downvotes,
      children: []
    };

    // Remove unneeded votes

    mappedComments[comment.id] = commentWithDetails;

    if (!commentWithDetails.parentId) {
      rootComments.push(commentWithDetails);
    }
  }

  const allComments = Object.values(mappedComments);

  // Early exit with default behaviour
  if (!reduceToTree) {
    return allComments;
  }

  // Iterate a second time to add children
  for (const comment of allComments) {
    if (comment.parentId && mappedComments[comment.parentId]) {
      mappedComments[comment.parentId].children.push(comment);
    }
  }

  return rootComments;
}
/**
 * @swagger
 * /proposals/{proposalIdOrPath}/comments:
 *   get:
 *     summary: Get proposal comments
 *     description: Return comments for a proposal as an array (default) or a tree
 *     tags:
 *      - 'Space API'
 *     parameters:
 *       - name: resultsAsTree
 *         in: query
 *         required: false
 *         description: Optional parameter to get the comments as a tree structure
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of proposals of casted vote
 *         content:
 *            application/json:
 *              schema:
 *                type: array
 *                $ref: '#/components/schemas/ProposalComment'
 *
 */
async function getProposalComments(req: NextApiRequest, res: NextApiResponse<PublicApiProposalComment[]>) {
  // This should never be undefined, but adding this safeguard for future proofing
  const spaceId = req.authorizedSpaceId;

  if (!spaceId) {
    throw new InvalidStateError('Space ID is undefined');
  }

  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: generatePageQuery({
        pageIdOrPath: req.query.proposalId as string,
        spaceIdOrDomain: spaceId
      })
    },
    select: {
      id: true
    }
  });

  const proposalComments = await prisma.pageComment.findMany({
    where: {
      pageId: proposal.id
    },
    select: {
      id: true,
      parentId: true,
      content: true,
      contentText: true,
      createdBy: true,
      createdAt: true,
      votes: {
        select: {
          upvoted: true
        }
      }
    }
  });

  const mappedComments = await mapReducePageComments({
    comments: proposalComments,
    reduceToTree: req.query.resultsAsTree === 'true'
  });

  return res.status(200).json(mappedComments);
}

async function createProposalComment(req: NextApiRequest, res: NextApiResponse<PublicApiProposalComment>) {
  // This should never be undefined, but adding this safeguard for future proofing
  const spaceId = req.authorizedSpaceId;

  if (!spaceId) {
    throw new InvalidStateError('Space ID is undefined');
  }

  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: generatePageQuery({
        pageIdOrPath: req.query.proposalId as string,
        spaceIdOrDomain: spaceId
      })
    },
    select: {
      id: true
    }
  });

  const userId = req.body.userId as string;

  const proposalComment = await prisma.pageComment.create({
    data: {
      page: { connect: { id: proposal.id } },
      parentId: req.body.parentId,
      contentText: req.body.content,
      user: { connect: { id: userId } },
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: req.body.content }]
          }
        ]
      }
    }
  });

  const apiComment: PublicApiProposalComment = {
    id: proposalComment.id,
    createdAt: proposalComment.createdAt.toISOString(),
    content: req.body.content,
    createdBy: userId,
    downvotes: 0,
    upvotes: 0,
    parentId: proposalComment.parentId,
    children: []
  };

  return res.status(201).json(apiComment);
}

export default withSessionRoute(handler);
