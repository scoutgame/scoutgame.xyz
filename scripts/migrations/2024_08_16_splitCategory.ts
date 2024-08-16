// @ts-nocheck
import { prisma } from '@charmverse/core/prisma-client';

/**
 * Transfer the category field to optimismCategory
 */

async function query() {
  const projects = await prisma.project.findMany({});
  for (const project of projects) {
    await project.update({
      where: {
        id: project.id
      },
      data: {
        optimismCategory: project.category
      }
    });
  }
}

query();
