import { readFileSync } from 'node:fs';

import type { ToolDefinitionWithFunction } from '@packages/llm/types';

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

// Search function with relevance scoring
export function searchRepositories({
  query,
  keys = ['description', 'topics', 'readme', 'name'],
  limit = 3
}: {
  query: string;
  keys?: (keyof Repository)[];
  limit?: number;
}) {
  // Load repositories from JSON file
  const repositories: Repository[] = JSON.parse(readFileSync(new URL('./repos.json', import.meta.url), 'utf-8'));

  const queryWords = query.toLowerCase().split(/\s+/); // Split query into words

  // Calculate relevance score for each repository
  const scoredResults = repositories.map((repo) => {
    let score = 0;

    keys?.forEach((key) => {
      const value = repo[key];
      if (Array.isArray(value)) {
        // Handle arrays like `topics`
        queryWords.forEach((word) => {
          if (value.some((item) => item.toLowerCase().includes(word))) {
            score += 3; // Assign higher weight for topic matches
          }
        });
      } else if (typeof value === 'string') {
        queryWords.forEach((word) => {
          const matchIndex = value.toLowerCase().indexOf(word);
          if (matchIndex !== -1) {
            // Higher score for matches in more relevant fields
            if (key === 'name') {
              score += 5;
            } else if (key === 'description') {
              score += 4;
            } else if (key === 'readme') {
              score += 2;
            } else {
              score += 1; // General match
            }
          }
        });
      }
    });

    // Bonus for multiple matches of different query words
    const uniqueMatches = queryWords.filter((word) =>
      keys?.some((key) => {
        const value = repo[key];
        if (Array.isArray(value)) {
          return value.some((item) => item.toLowerCase().includes(word));
        } else if (typeof value === 'string') {
          return value.toLowerCase().includes(word);
        }
        return false;
      })
    ).length;

    score += uniqueMatches * 2; // Add bonus points for multiple word matches

    return { repo, score };
  });

  // Sort repositories by score in descending order and filter out non-matching results
  const sortedResults = scoredResults
    .filter((result) => result.score > 0) // Only include relevant matches
    .sort((a, b) => b.score - a.score) // Sort by relevance score
    .map((result) => result.repo); // Return sorted repositories

  // Return the top N results based on the limit parameter
  return sortedResults.slice(0, limit);
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
