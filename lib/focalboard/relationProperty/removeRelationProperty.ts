import { prisma } from '@charmverse/core/prisma-client';

import { NotFoundError } from 'lib/middleware';

import { getRelationData } from './getRelationData';

export type RemoveRelationPropertyPayload = {
  boardId: string;
  templateId: string;
  removeBoth?: boolean;
};

export async function removeRelationProperty(payload: RemoveRelationPropertyPayload & { userId: string }) {
  const { userId, boardId, templateId, removeBoth } = payload;
  const { connectedBoard, connectedBoardProperties, connectedRelationProperty } = await getRelationData({
    boardId,
    templateId
  });

  if (!connectedRelationProperty) {
    throw new NotFoundError('Connected relation property not found');
  }

  await prisma.block.update({
    data: {
      fields: {
        ...(connectedBoard?.fields as any),
        cardProperties: removeBoth
          ? connectedBoardProperties.filter((cp) => cp.id !== connectedRelationProperty.id)
          : connectedBoardProperties.map((cp) => {
              if (cp.id === connectedRelationProperty.id) {
                return {
                  ...cp,
                  relationData: {
                    ...cp.relationData,
                    relatedPropertyId: null,
                    showOnRelatedBoard: false
                  }
                };
              }
              return cp;
            })
      },
      updatedBy: userId
    },
    where: {
      id: connectedBoard.id
    }
  });
}
