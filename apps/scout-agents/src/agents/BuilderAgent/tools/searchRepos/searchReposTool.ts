import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { ToolDefinitionWithFunction } from '@packages/llm/types';
import type { IFuseOptions } from 'fuse.js';
import Fuse from 'fuse.js';

// Define the repository type
type Repository = {
  id: number;
  owner: string;
  name: string;
  url: string;
  topics: string[];
  description: string | null;
  language: string | null;
  readme: string;
};

const fuseSearchOptions: IFuseOptions<Repository> = {
  keys: [
    { name: 'name', weight: 1 },
    { name: 'description', weight: 1 },
    { name: 'topics', weight: 2 },
    { name: 'readme', weight: 1.2 }
  ],
  threshold: 0.3,
  shouldSort: true
};

// Search function with relevance scoring
export function searchRepositories({
  query,
  limit = 5
}: {
  query: string;
  keys?: (keyof Repository)[];
  limit?: number;
}) {
  // Load repositories from JSON file
  const repositories: Repository[] = JSON.parse(
    readFileSync(path.resolve('src/agents/BuilderAgent/tools/searchRepos/repos.json'), 'utf-8')
  );

  const fuse = new Fuse(repositories, fuseSearchOptions);

  const results = fuse.search(query).map((result) => result.item);

  // Return the top N results based on the limit parameter
  return results.slice(0, limit);
}

export const searchReposToolDefinition: ToolDefinitionWithFunction = {
  name: 'searchRepos',
  description: 'Search for repositories based on a query',
  parameters: {
    query: { type: 'string', description: 'The keywords to search for' }
  },
  functionImplementation: searchRepositories,
  required: ['query']
};
