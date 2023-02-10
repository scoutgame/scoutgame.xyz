import type { WebhookEventNames } from 'lib/webhook/interfaces';

import {
  getBountyEntity,
  getUserEntity,
  getCommentEntity,
  getSpaceEntity,
  getPostEntity,
  getProposalEntity
} from './entities';
import { publishWebhookEvent } from './publisher';

type DiscussionEventContext = {
  scope: WebhookEventNames.DiscussionCreated;
  spaceId: string;
  postId: string;
};

export async function publishPostEvent(context: DiscussionEventContext) {
  const [post, space] = await Promise.all([getPostEntity(context.postId), getSpaceEntity(context.spaceId)]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    discussion: post
  });
}

type CommentEventContext = {
  scope: WebhookEventNames.CommentCreated;
  spaceId: string;
  postId: string;
  commentId: string;
};

export async function publishPostCommentEvent(context: CommentEventContext) {
  const [post, comment, space] = await Promise.all([
    getPostEntity(context.postId),
    getCommentEntity(context.commentId),
    getSpaceEntity(context.spaceId)
  ]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    comment,
    discussion: post
  });
}

type CommentVoteEventContext = {
  scope: WebhookEventNames.CommentDownvoted | WebhookEventNames.CommentUpvoted;
  spaceId: string;
  postId: string;
  commentId: string;
  voterId: string;
};

export async function publishPostCommentVoteEvent(context: CommentVoteEventContext) {
  const [discussion, comment, space, voter] = await Promise.all([
    getPostEntity(context.postId),
    getCommentEntity(context.commentId),
    getSpaceEntity(context.spaceId),
    getUserEntity(context.voterId)
  ]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    comment,
    discussion,
    voter
  });
}

type MemberEventContext = {
  scope: WebhookEventNames.MemberJoined;
  spaceId: string;
  userId: string;
};

export async function publishMemberEvent(context: MemberEventContext) {
  const [space, user] = await Promise.all([getSpaceEntity(context.spaceId), getUserEntity(context.userId)]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    user
  });
}

type BountyEventContext = {
  scope: WebhookEventNames.BountyCompleted;
  bountyId: string;
  spaceId: string;
  userId: string;
};

export async function publishBountyEvent(context: BountyEventContext) {
  const [space, bounty, user] = await Promise.all([
    getSpaceEntity(context.spaceId),
    getBountyEntity(context.bountyId),
    getUserEntity(context.userId)
  ]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    bounty,
    space,
    user
  });
}

type ProposalEventContext = {
  scope: WebhookEventNames.ProposalPassed | WebhookEventNames.ProposalFailed;
  proposalId: string;
  spaceId: string;
};

export async function publishProposalEvent(context: ProposalEventContext) {
  const [space, proposal] = await Promise.all([getSpaceEntity(context.spaceId), getProposalEntity(context.proposalId)]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    proposal,
    space
  });
}

type ProposalUserEventContext = {
  scope: WebhookEventNames.ProposalSuggestionApproved | WebhookEventNames.ProposalUserVote;
  proposalId: string;
  spaceId: string;
  userId: string;
};

export async function publishUserProposalEvent(context: ProposalUserEventContext) {
  const [space, proposal, user] = await Promise.all([
    getSpaceEntity(context.spaceId),
    getProposalEntity(context.proposalId),
    getUserEntity(context.userId)
  ]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    proposal,
    space,
    user
  });
}
