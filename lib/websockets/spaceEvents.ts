import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { unsealData } from 'iron-session';
import type { Socket } from 'socket.io';

import { modifyChildPages } from 'lib/pages/modifyChildPages';
import { applyStepsToNode } from 'lib/prosemirror/applyStepsToNode';
import { emptyDocument } from 'lib/prosemirror/constants';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { authSecret } from 'lib/session/config';
import type { ClientMessage, SealedUserId } from 'lib/websockets/interfaces';
import { relay } from 'lib/websockets/relay';

import { docRooms } from './documentEvents/documentEvents';

export class SpaceEventHandler {
  socketEvent = 'message';

  userId: string | null = null;

  constructor(private socket: Socket) {
    this.socket = socket;
  }

  init() {
    this.socket.on(this.socketEvent, async (message) => {
      try {
        await this.onMessage(message);
      } catch (error) {
        log.error('Error handling space socket message', error);
      }
    });

    this.socket.emit(this.socketEvent, { type: 'welcome' });
  }

  async onMessage(message: ClientMessage) {
    if (message.type === 'subscribe') {
      try {
        const { userId: decryptedUserId } = await unsealData<SealedUserId>(message.payload.authToken, {
          password: authSecret
        });
        if (typeof decryptedUserId === 'string') {
          this.userId = decryptedUserId;
          relay.registerWorkspaceSubscriber({
            userId: decryptedUserId,
            socket: this.socket,
            roomId: message.payload.spaceId
          });
        }
      } catch (error) {
        log.error('Error subscribing user to space events', { error });
        this.sendError('Error subscribing to space');
      }
    } else if (message.type === 'page_deleted' && this.userId) {
      try {
        const page = await prisma.page.findUniqueOrThrow({
          where: {
            id: message.payload.id
          },
          select: {
            parentId: true
          }
        });

        const parentPage = page.parentId
          ? await prisma.page.findUniqueOrThrow({
              where: {
                id: page.parentId
              },
              select: {
                content: true
              }
            })
          : null;

        const { parentId } = page;
        const content = (parentPage?.content ?? emptyDocument) as PageContent;
        const documentRoom = parentId ? docRooms.get(parentId) : null;

        if (documentRoom) {
          const participants = Array.from(documentRoom.participants.values());
          // Use the first participant if the user who triggered space event is not in the document
          const participant =
            participants.find(
              // Send the userId using payload for now
              (_participant) => _participant.getSessionMeta().userId === this.userId
            ) ?? participants[0];

          if (participant) {
            // Go through all the node of the document and find the position of the node of type: 'page'
            let position: null | number = null;

            documentRoom.node.forEach((node, nodePos) => {
              if (node.type.name === 'page' && node.attrs.id === message.payload.id) {
                position = nodePos;
                return false;
              }
            });

            if (position !== null) {
              // TODO: Should this be handleDiff or handleMessage?
              await participant.handleDiff(
                {
                  type: 'diff',
                  ds: [
                    {
                      stepType: 'replace',
                      from: position,
                      to: position + 1
                    }
                  ],
                  doc: documentRoom.doc.content,
                  // TODO: How to get the correct c, s and v values?
                  c: participant.messages.client,
                  s: participant.messages.server,
                  v: documentRoom.doc.version,
                  // TODO: How to get the correct rid and cid values?
                  rid: 0,
                  cid: -1
                },
                { skipSendingToActor: false }
              );
            }
          } else if (parentId) {
            await applyNestedPageReplaceDiffAndSaveDocument({
              deletedPageId: message.payload.id,
              content,
              parentId,
              userId: this.userId
            });
          }
        } else if (parentId) {
          await applyNestedPageReplaceDiffAndSaveDocument({
            deletedPageId: message.payload.id,
            content,
            parentId,
            userId: this.userId
          });
        }
      } catch (error) {
        const errorMessage = 'Error deleting a page after link was deleted from its parent page';
        log.error(errorMessage, {
          error,
          pageId: message.payload.id,
          userId: this.userId
        });
        this.sendError(errorMessage);
      }
    }
  }

  sendError(message: string) {
    this.socket.emit(this.socketEvent, { type: 'error', message });
  }
}

async function applyNestedPageReplaceDiffAndSaveDocument({
  deletedPageId,
  content,
  userId,
  parentId
}: {
  deletedPageId: string;
  content: PageContent;
  userId: string;
  parentId: string;
}) {
  const pageNode = getNodeFromJson(content);
  let position: null | number = null;

  pageNode.forEach((node, nodePos) => {
    if (node.type.name === 'page' && node.attrs.id === deletedPageId) {
      position = nodePos;
      return false;
    }
  });

  if (position === null) {
    return;
  }

  const updatedNode = applyStepsToNode(
    [
      {
        from: position,
        to: position + 1,
        stepType: 'replace'
      }
    ],
    pageNode
  );

  const { spaceId } = await prisma.page.update({
    where: { id: parentId },
    data: {
      content: updatedNode.toJSON(),
      contentText: updatedNode.textContent,
      hasContent: updatedNode.textContent.length > 0,
      updatedAt: new Date(),
      updatedBy: userId
    },
    select: {
      spaceId: true
    }
  });

  const modifiedChildPageIds = await modifyChildPages(deletedPageId, userId, 'archive');
  relay.broadcast(
    {
      type: 'pages_deleted',
      payload: modifiedChildPageIds.map((id) => ({ id }))
    },
    spaceId
  );
}
