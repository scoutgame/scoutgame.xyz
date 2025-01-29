import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

export async function generateProjectPath(name: string) {
  const path = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  const existingProject = await prisma.scoutProject.count({ where: { path } });
  if (existingProject > 0) {
    return `${path}-${v4().split('-')[0]}`;
  }
  return path;
}
