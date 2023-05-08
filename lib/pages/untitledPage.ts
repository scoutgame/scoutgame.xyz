import type { Page } from '@charmverse/core/prisma';
import { v4 as uuid } from 'uuid';

export function untitledPage({ userId, spaceId }: { userId: string; spaceId: string }): Partial<Page> {
  return {
    createdBy: userId,
    autoGenerated: true,
    content: {
      type: 'doc',
      content: []
    },
    contentText: '',
    path: uuid(),
    title: '',
    type: 'page',
    updatedAt: new Date(),
    updatedBy: userId,
    spaceId,
    deletedAt: null
  };
}
