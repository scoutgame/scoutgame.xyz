import { v4 } from 'uuid';

import { getProjectByPath } from './getProjectByPath';

export async function generateProjectPath(name: string) {
  const path = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  const existingProject = await getProjectByPath(path);
  if (existingProject) {
    return `${path}-${v4().split('-')[0]}`;
  }
  return path;
}
