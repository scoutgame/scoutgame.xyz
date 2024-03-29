import { prisma } from '@charmverse/core/prisma-client';
import { uniq } from 'lodash';

import { appendFileSync, readFileSync } from 'fs';
import { isTruthy } from 'lib/utils/types';
const FILE_PATH = './orphans';

const totalPages = 404701;
const perBatch = 1000;

let counts = {
  pages: 0,
  boards: 0,
  deletedBoards: 0,
  cards: 0
};

async function search() {
  const pageIds = readFileSync(FILE_PATH + '.txt', 'utf-8')
    .split('\n')
    .filter(Boolean);
  const pages = await prisma.page.findMany({
    where: {
      id: {
        in: pageIds
      },
      parentId: {
        not: null
      }
    },
    // include: {
    //   card: true
    // },
    select: {
      type: true,
      id: true,
      updatedAt: true,
      title: true,
      contentText: true,
      boardId: true,
      cardId: true
    }
  });
  console.log(pages);

  for (let page of pages) {
    console.log('processing', page.type, page.id, page.boardId, page.cardId);
    if (page.type.includes('board')) {
      // console.log('board', page.boardId);
      const block = await prisma.block.findFirst({
        where: {
          id: page.boardId || page.id,
          deletedAt: null
        }
      });
      if (block) {
        counts.boards++;
        await prisma.page.update({
          where: {
            id: page.id
          },
          data: {
            parentId: null
          }
        });
      } else {
        counts.deletedBoards++;
        await prisma.page.delete({
          where: {
            id: page.id
          }
        });
      }
      //console.log('has block', page.boardId, !!block);
    } else if (page.type.includes('card')) {
      counts.cards++;
      if (page.cardId) {
        await prisma.block.delete({
          where: {
            id: page.cardId || page.id
          }
        });
      } else {
        await prisma.page.delete({
          where: {
            id: page.id
          }
        });
      }

      //  console.log('has card', page.cardId, !!card);
    } else {
      counts.pages++;
      await prisma.page.update({
        where: {
          id: page.id
        },
        data: {
          parentId: null
        }
      });
    }
  }
  console.log(counts);
  //console.log(pages.map((p) => p.space.domain));
}

search().then(() => console.log('Done'));
