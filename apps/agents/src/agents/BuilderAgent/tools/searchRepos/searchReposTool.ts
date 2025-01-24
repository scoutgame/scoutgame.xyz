import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { ToolDefinitionWithFunction } from '@packages/llm/interfaces';
import type { IFuseOptions } from 'fuse.js';
import Fuse from 'fuse.js';

// Define the repository type
export type Repository = {
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
  keys: [{ name: 'summary' }, { name: 'topics' }],
  threshold: 0.1,
  isCaseSensitive: false,
  // findAllMatches: true,
  shouldSort: true,
  ignoreLocation: true
};

type SearchQuery = {
  query: string;
  limit?: number;
  // keys?: (keyof Repository)[];
};

// Search function with relevance scoring
export function searchRepositories({ query, limit = 5 }: SearchQuery) {
  // Load repositories from JSON file
  const repositories: Repository[] = JSON.parse(
    readFileSync(path.resolve('src/agents/BuilderAgent/tools/searchRepos/repos-enriched.json'), 'utf-8')
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
