import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

export async function generateUserPath(displayName: string) {
  const path = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  const existingUser = await prisma.scout.count({ where: { path } });
  if (existingUser > 0) {
    return `${path}-${v4().split('-')[0]}`;
  }
  return path;
}
