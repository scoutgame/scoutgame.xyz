import type { ProposalStatus } from '@charmverse/core/prisma-client';

import type { UserMentionMetadata } from 'lib/prosemirror/extractMentions';
import type { CardPropertyEntity } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import {
  getBountyEntity,
  getUserEntity,
  getCommentEntity,
  getSpaceEntity,
  getPostEntity,
  getProposalEntity,
  getDocumentEntity,
  getInlineCommentEntity,
  getVoteEntity,
  getApplicationEntity,
  getBlockCommentEntity
} from './entities';
import { publishWebhookEvent } from './publisher';

type PostEventContext = {
  scope: WebhookEventNames.ForumPostCreated;
  spaceId: string;
  postId: string;
};

export async function publishPostEvent(context: PostEventContext) {
  const [post, space] = await Promise.all([getPostEntity(context.postId), getSpaceEntity(context.spaceId)]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    post
  });
}

type CommentVoteEventContext = {
  scope: WebhookEventNames.ForumCommentDownvoted | WebhookEventNames.ForumCommentUpvoted;
  spaceId: string;
  postId: string;
  commentId: string;
  voterId: string;
};

export async function publishPostCommentVoteEvent(context: CommentVoteEventContext) {
  const [post, comment, space, voter] = await Promise.all([
    getPostEntity(context.postId),
    getCommentEntity(context.commentId, true),
    getSpaceEntity(context.spaceId),
    getUserEntity(context.voterId)
  ]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    comment,
    post,
    voter
  });
}

type MemberEventContext = {
  scope: WebhookEventNames.UserJoined;
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
  spaceId: string;
  bountyId: string;
} & (
  | {
      scope: WebhookEventNames.BountyCompleted | WebhookEventNames.BountySuggestionCreated;
      userId: string;
    }
  | {
      scope:
        | WebhookEventNames.BountyApplicationCreated
        | WebhookEventNames.BountyApplicationAccepted
        | WebhookEventNames.BountyApplicationSubmitted;
      applicationId: string;
    }
  | {
      scope:
        | WebhookEventNames.BountyApplicationRejected
        | WebhookEventNames.BountyApplicationApproved
        | WebhookEventNames.BountyApplicationPaymentCompleted;
      userId: string;
      applicationId: string;
    }
);

export async function publishBountyEvent(context: BountyEventContext) {
  const [space, bounty] = await Promise.all([getSpaceEntity(context.spaceId), getBountyEntity(context.bountyId)]);
  switch (context.scope) {
    case WebhookEventNames.BountyCompleted: {
      const user = await getUserEntity(context.userId);
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        bounty,
        space,
        user
      });
    }

    case WebhookEventNames.BountyApplicationCreated:
    case WebhookEventNames.BountyApplicationSubmitted:
    case WebhookEventNames.BountyApplicationAccepted: {
      const application = await getApplicationEntity(context.applicationId);
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        bounty,
        space,
        application
      });
    }

    case WebhookEventNames.BountyApplicationRejected:
    case WebhookEventNames.BountyApplicationApproved:
    case WebhookEventNames.BountyApplicationPaymentCompleted: {
      const [application, user] = await Promise.all([
        getApplicationEntity(context.applicationId),
        getUserEntity(context.userId)
      ]);
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        bounty,
        space,
        application,
        user
      });
    }

    default: {
      return null;
    }
  }
}

type ProposalEventContext =
  | {
      scope: WebhookEventNames.ProposalPassed | WebhookEventNames.ProposalFailed;
      proposalId: string;
      spaceId: string;
    }
  | {
      userId: string;
      spaceId: string;
      proposalId: string;
      scope: WebhookEventNames.ProposalStatusChanged;
      newStatus: ProposalStatus;
      oldStatus: ProposalStatus | null;
    };

export async function publishProposalEvent(context: ProposalEventContext) {
  const [space, proposal] = await Promise.all([getSpaceEntity(context.spaceId), getProposalEntity(context.proposalId)]);

  switch (context.scope) {
    case WebhookEventNames.ProposalStatusChanged: {
      const user = await getUserEntity(context.userId);
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        proposal,
        space,
        user,
        oldStatus: context.oldStatus,
        newStatus: context.newStatus
      });
    }
    case WebhookEventNames.ProposalPassed:
    case WebhookEventNames.ProposalFailed: {
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        proposal,
        space
      });
    }
    default: {
      return null;
    }
  }
}

type ProposalUserEventContext = {
  scope: WebhookEventNames.ProposalSuggestionApproved | WebhookEventNames.ProposalUserVoted;
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

type DocumentEventContext = (
  | {
      scope: WebhookEventNames.DocumentMentionCreated;
      documentId: string;
      mention: UserMentionMetadata;
      userId: string;
    }
  | {
      scope: WebhookEventNames.DocumentInlineCommentCreated;
      inlineCommentId: string;
      documentId: string;
    }
  | {
      scope: WebhookEventNames.DocumentCommentCreated;
      commentId: string;
      postId?: string;
      documentId?: string;
    }
) & {
  spaceId: string;
};

export async function publishDocumentEvent(context: DocumentEventContext) {
  const space = await getSpaceEntity(context.spaceId);

  switch (context.scope) {
    case WebhookEventNames.DocumentInlineCommentCreated: {
      const document = await getDocumentEntity(context.documentId);
      const inlineComment = await getInlineCommentEntity(context.inlineCommentId);
      return publishWebhookEvent(context.spaceId, {
        scope: WebhookEventNames.DocumentInlineCommentCreated,
        document,
        space,
        inlineComment
      });
    }
    case WebhookEventNames.DocumentMentionCreated: {
      const [document, user] = await Promise.all([
        getDocumentEntity(context.documentId),
        getUserEntity(context.userId)
      ]);
      return publishWebhookEvent(context.spaceId, {
        scope: WebhookEventNames.DocumentMentionCreated,
        document,
        space,
        user,
        mention: context.mention
      });
    }
    case WebhookEventNames.DocumentCommentCreated: {
      const comment = await getCommentEntity(context.commentId);
      if (context.documentId) {
        const document = await getDocumentEntity(context.documentId);
        return publishWebhookEvent(context.spaceId, {
          scope: WebhookEventNames.DocumentCommentCreated,
          document,
          post: null,
          space,
          comment
        });
      } else if (context.postId) {
        const post = await getPostEntity(context.postId);
        return publishWebhookEvent(context.spaceId, {
          scope: WebhookEventNames.DocumentCommentCreated,
          document: null,
          post,
          space,
          comment
        });
      } else {
        return null;
      }
    }
    default: {
      return null;
    }
  }
}

type VoteEventContext = {
  scope: WebhookEventNames.VoteCreated;
  voteId: string;
  spaceId: string;
};

export async function publishVoteEvent(context: VoteEventContext) {
  const [space, vote] = await Promise.all([getSpaceEntity(context.spaceId), getVoteEntity(context.voteId)]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    vote
  });
}

export type CardEventContext =
  | {
      scope: WebhookEventNames.CardBlockCommentCreated;
      cardId: string;
      spaceId: string;
      blockCommentId: string;
    }
  | {
      scope: WebhookEventNames.CardPersonPropertyAssigned;
      cardId: string;
      spaceId: string;
      cardProperty: CardPropertyEntity;
      userId: string;
    };

export async function publishCardEvent(context: CardEventContext) {
  const { scope } = context;
  const [space, card] = await Promise.all([getSpaceEntity(context.spaceId), getDocumentEntity(context.cardId)]);

  switch (scope) {
    case WebhookEventNames.CardBlockCommentCreated: {
      const blockComment = await getBlockCommentEntity(context.blockCommentId);
      return publishWebhookEvent(context.spaceId, {
        scope,
        space,
        card,
        blockComment
      });
    }
    case WebhookEventNames.CardPersonPropertyAssigned: {
      const assignedUser = await getUserEntity(context.cardProperty.value);
      return publishWebhookEvent(context.spaceId, {
        scope,
        space,
        card,
        assignedUser,
        personProperty: context.cardProperty,
        user: await getUserEntity(context.userId)
      });
    }
    default: {
      return null;
    }
  }
}
