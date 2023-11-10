/* eslint-disable no-continue */
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { getPermissionsClient } from 'lib/permissions/api';
import type { UserMentionMetadata } from 'lib/prosemirror/extractMentions';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { ThreadAccessGroup } from 'lib/threads';
import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import { saveDocumentNotification } from '../saveNotification';

async function getUserIdsFromRoles({
  group,
  value,
  spaceId
}: {
  spaceId: string;
  group: 'role' | 'user';
  value: string;
}) {
  const targetUserIds: string[] = [];

  if (group === 'role') {
    if (value === 'everyone' || value === 'admin') {
      const spaceRoles = await prisma.spaceRole.findMany({
        where: {
          spaceId,
          isAdmin: value === 'admin' ? true : undefined
        },
        select: {
          user: {
            select: {
              id: true
            }
          }
        }
      });

      spaceRoles.forEach((spaceRole) => {
        targetUserIds.push(spaceRole.user.id);
      });
    } else {
      const role = await prisma.role.findFirstOrThrow({
        where: {
          id: value
        },
        select: {
          spaceRolesToRole: {
            select: {
              spaceRole: {
                select: {
                  user: {
                    select: {
                      id: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      role.spaceRolesToRole.forEach(({ spaceRole }) => {
        targetUserIds.push(spaceRole.user.id);
      });
    }
  }

  if (group === 'user') {
    targetUserIds.push(value);
  }

  return targetUserIds;
}

export async function createDocumentNotifications(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}): Promise<string[]> {
  const ids: string[] = [];
  switch (webhookData.event.scope) {
    case WebhookEventNames.DocumentMentionCreated: {
      const mentionId = webhookData.event.mention.id;
      const mentionAuthorId = webhookData.event.user.id;
      const pageId = webhookData.event.document?.id;
      const postId = webhookData.event.post?.id;
      let targetMention: UserMentionMetadata | undefined;
      if (webhookData.event.document) {
        const document = await prisma.page.findUniqueOrThrow({
          where: {
            id: pageId
          },
          select: {
            content: true
          }
        });
        const documentContent = document.content as PageContent;
        targetMention = extractMentions(documentContent).find((mention) => mention.id === mentionId);
      } else if (webhookData.event.post) {
        const post = await prisma.post.findUniqueOrThrow({
          where: {
            id: postId
          },
          select: {
            content: true,
            categoryId: true
          }
        });
        const postContent = post.content as PageContent;
        targetMention = extractMentions(postContent).find((mention) => mention.id === mentionId);
      }

      if (!targetMention) {
        log.warn('Ignore user mention - could not find it in the doc', {
          pageId,
          postId,
          mentionAuthorId,
          targetMention
        });
        break;
      }

      const targetUserIds = (
        await getUserIdsFromRoles({
          group: targetMention.type,
          value: targetMention.id,
          spaceId: webhookData.spaceId
        })
      ).filter((userId) => userId !== mentionAuthorId);

      const permissionsClient = await getPermissionsClient({
        resourceId: webhookData.spaceId,
        resourceIdType: 'space'
      });

      for (const targetUserId of targetUserIds) {
        let hasReadPermission = false;
        if (pageId) {
          const pagePermission = await permissionsClient.client.pages.computePagePermissions({
            resourceId: pageId,
            userId: targetUserId
          });

          hasReadPermission = pagePermission.read;
        } else if (postId) {
          const postPermission = await permissionsClient.client.forum.computePostPermissions({
            resourceId: postId,
            userId: targetUserId
          });

          hasReadPermission = postPermission.view_post;
        }

        if (!hasReadPermission) {
          continue;
        }

        const { id } = await saveDocumentNotification({
          type: 'mention.created',
          createdAt: webhookData.createdAt,
          createdBy: mentionAuthorId,
          mentionId,
          pageId,
          postId,
          spaceId: webhookData.spaceId,
          userId: targetUserId,
          content: targetMention.parentNode ?? null
        });
        ids.push(id);
      }
      break;
    }

    case WebhookEventNames.DocumentInlineCommentCreated: {
      const data = webhookData.event;
      const spaceId = data.space.id;
      const inlineCommentId = data.inlineComment.id;
      const inlineCommentAuthorId = data.inlineComment.author.id;
      const inlineComment = await prisma.comment.findFirstOrThrow({
        where: {
          id: inlineCommentId
        },
        select: {
          content: true,
          threadId: true,
          thread: {
            select: {
              accessGroups: true
            }
          }
        }
      });
      const threadAccessGroups = inlineComment.thread.accessGroups as unknown as ThreadAccessGroup[];
      const threadId = inlineComment.threadId;
      const inlineCommentContent = inlineComment.content as PageContent;
      const previousInlineComment = await prisma.comment.findFirst({
        where: {
          threadId
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: 1,
        take: 1,
        select: {
          id: true,
          userId: true
        }
      });

      const notificationTargetUserIds = data.document.authors.map((author) => author.id);

      // Get all the users that have access to the thread
      for (const threadAccessGroup of threadAccessGroups) {
        const accessGroupsUserIds = await getUserIdsFromRoles({
          group: threadAccessGroup.group,
          value: threadAccessGroup.id,
          spaceId
        });

        accessGroupsUserIds.forEach((userId) => {
          notificationTargetUserIds.push(userId);
        });
      }

      const pageId = data.document.id;
      if (
        previousInlineComment &&
        previousInlineComment?.id !== inlineCommentId &&
        previousInlineComment.userId !== inlineCommentAuthorId
      ) {
        const { id } = await saveDocumentNotification({
          type: 'inline_comment.replied',
          createdAt: webhookData.createdAt,
          createdBy: inlineCommentAuthorId,
          inlineCommentId,
          pageId,
          spaceId,
          userId: previousInlineComment.userId,
          content: inlineCommentContent
        });
        ids.push(id);
      }

      const permissionsClient = await getPermissionsClient({
        resourceId: webhookData.spaceId,
        resourceIdType: 'space'
      });

      for (const userId of new Set(notificationTargetUserIds)) {
        const pagePermission = await permissionsClient.client.pages.computePagePermissions({
          resourceId: pageId,
          userId
        });

        if (pagePermission.read && inlineCommentAuthorId !== userId && previousInlineComment?.userId !== userId) {
          const { id } = await saveDocumentNotification({
            type: 'inline_comment.created',
            createdAt: webhookData.createdAt,
            createdBy: inlineCommentAuthorId,
            inlineCommentId,
            pageId,
            spaceId,
            userId,
            content: inlineCommentContent
          });
          ids.push(id);
        }
      }

      const extractedMentions = extractMentions(inlineCommentContent);
      for (const extractedMention of extractedMentions) {
        const targetUserIds = (
          await getUserIdsFromRoles({
            group: extractedMention.type,
            value: extractedMention.value,
            spaceId: webhookData.spaceId
          })
        ).filter((userId) => userId !== inlineCommentAuthorId);

        for (const targetUserId of targetUserIds) {
          const pagePermission = await permissionsClient.client.pages.computePagePermissions({
            resourceId: pageId,
            userId: targetUserId
          });

          if (!pagePermission.read) {
            continue;
          }

          const { id } = await saveDocumentNotification({
            type: 'inline_comment.mention.created',
            createdAt: webhookData.createdAt,
            createdBy: inlineCommentAuthorId,
            mentionId: extractedMention.id,
            pageId,
            spaceId,
            userId: targetUserId,
            content: extractedMention.parentNode ?? null,
            inlineCommentId
          });
          ids.push(id);
        }
      }
      break;
    }

    case WebhookEventNames.DocumentCommentCreated: {
      const spaceId = webhookData.spaceId;
      const commentAuthorId = webhookData.event.comment.author.id;
      const commentId = webhookData.event.comment.id;
      const authorIds = webhookData.event.post
        ? [webhookData.event.post.author.id]
        : webhookData.event.document?.authors.map(({ id }) => id) ?? [];
      const documentId = webhookData.event.document?.id;
      const postId = webhookData.event.post?.id;

      const comment = webhookData.event.post
        ? await prisma.postComment.findFirstOrThrow({
            where: {
              id: commentId
            },
            select: {
              parentId: true,
              content: true
            }
          })
        : await prisma.pageComment.findFirstOrThrow({
            where: {
              id: commentId
            },
            select: {
              parentId: true,
              content: true
            }
          });

      // Send notification only for top-level comments
      if (!comment.parentId) {
        for (const authorId of authorIds) {
          if (authorId !== commentAuthorId) {
            const { id } = await saveDocumentNotification({
              type: 'comment.created',
              createdAt: webhookData.createdAt,
              createdBy: commentAuthorId,
              commentId,
              pageId: documentId,
              postId,
              spaceId,
              pageCommentId: documentId ? commentId : undefined,
              postCommentId: postId ? commentId : undefined,
              userId: authorId,
              content: comment.content
            });
            ids.push(id);
          }
        }
      } else {
        const parentComment = webhookData.event.post
          ? await prisma.postComment.findUniqueOrThrow({
              where: {
                id: comment.parentId
              },
              select: {
                createdBy: true
              }
            })
          : await prisma.pageComment.findUniqueOrThrow({
              where: {
                id: comment.parentId
              },
              select: {
                createdBy: true
              }
            });

        const parentCommentAuthorId = parentComment.createdBy;
        if (parentCommentAuthorId !== commentAuthorId) {
          const { id } = await saveDocumentNotification({
            type: 'comment.replied',
            createdAt: webhookData.createdAt,
            createdBy: commentAuthorId,
            commentId,
            pageId: documentId,
            postId,
            spaceId,
            pageCommentId: documentId ? commentId : undefined,
            postCommentId: postId ? commentId : undefined,
            userId: parentCommentAuthorId,
            content: comment.content
          });
          ids.push(id);
        }
      }

      const commentContent = comment.content as PageContent;

      const extractedMentions = extractMentions(commentContent);

      const permissionsClient = await getPermissionsClient({
        resourceId: webhookData.spaceId,
        resourceIdType: 'space'
      });

      for (const extractedMention of extractedMentions) {
        const targetUserIds = (
          await getUserIdsFromRoles({
            group: extractedMention.type,
            value: extractedMention.value,
            spaceId: webhookData.spaceId
          })
        ).filter((userId) => userId !== commentAuthorId);

        for (const targetUserId of targetUserIds) {
          let hasReadPermission = false;
          if (documentId) {
            const pagePermission = await permissionsClient.client.pages.computePagePermissions({
              resourceId: documentId,
              userId: targetUserId
            });

            hasReadPermission = pagePermission.read;
          } else if (postId) {
            const postPermission = await permissionsClient.client.forum.computePostPermissions({
              resourceId: postId,
              userId: targetUserId
            });

            hasReadPermission = postPermission.view_post;
          }

          if (!hasReadPermission) {
            continue;
          }

          const { id } = await saveDocumentNotification({
            type: 'comment.mention.created',
            createdAt: webhookData.createdAt,
            createdBy: commentAuthorId,
            mentionId: extractedMention.id,
            pageId: documentId,
            postId,
            spaceId,
            userId: targetUserId,
            content: extractedMention.parentNode ?? null,
            pageCommentId: documentId ? commentId : undefined,
            postCommentId: postId ? commentId : undefined,
            commentId
          });
          ids.push(id);
        }
      }

      break;
    }

    default:
      break;
  }
  return ids;
}
