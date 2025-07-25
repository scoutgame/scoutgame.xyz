import { log } from '@charmverse/core/log';
import { octokit } from '@packages/github/client';

type LinkedIssue = {
  number: number;
  tags: string[];
};

interface GithubComment {
  body?: string | null;
}

interface GithubLabel {
  id: number;
  node_id: string;
  url: string;
  name: string;
  description: string | null;
  color: string | null;
  default: boolean;
}

/**
 * Extracts issue numbers from GitHub comment text using regex
 */
function extractIssueReferences(text: string): string[] {
  const matches: string[] = [];

  // Match both forms: #123 and owner/repo#123
  const issueRegex = /(?:^|\s)(?:([a-zA-Z0-9-]+\/[a-zA-Z0-9-]+))?#(\d+)(?:\s|$)/g;
  // Match GitHub issue URLs: https://github.com/owner/repo/issues/123
  const urlRegex = /https:\/\/github\.com\/([a-zA-Z0-9-.]+)\/([a-zA-Z0-9-.]+)\/issues\/(\d+)/g;

  // Extract issue references from #123 and owner/repo#123 format
  for (const match of text.matchAll(issueRegex)) {
    if (match[1]) {
      // Cross-repository reference
      matches.push(`${match[1]}#${match[2]}`);
    } else {
      // Same repository reference
      matches.push(`#${match[2]}`);
    }
  }

  // Extract issue references from URLs
  for (const match of text.matchAll(urlRegex)) {
    const [, owner, repo, number] = match;
    matches.push(`${owner}/${repo}#${number}`);
  }

  return matches;
}

/**
 * Verifies if a PR references an issue using GitHub's search API
 */
async function verifyPRReferencesIssue({
  owner,
  repo,
  issueNumber,
  pullNumber
}: {
  owner: string;
  repo: string;
  issueNumber: number;
  pullNumber: number;
}): Promise<boolean> {
  try {
    // Search for PRs that reference this issue
    const { data: searchResults } = await octokit.request('GET /search/issues', {
      q: `repo:${owner}/${repo} is:pr ${issueNumber}`,
      per_page: 100
    });

    // Check if our PR number is in the results
    return searchResults.items.some((item) => item.number === pullNumber);
  } catch (error) {
    // If search fails, return false
    return false;
  }
}

/**
 * Fetches all linked issues for a pull request by analyzing comments and cross-references
 */
export async function getLinkedIssue({
  owner,
  repo,
  pullNumber
}: {
  owner: string;
  repo: string;
  pullNumber: number;
}): Promise<LinkedIssue | null> {
  const linkedIssues = new Map<string, LinkedIssue>();

  // 1. Fetch inline review comments (comments on specific lines of code)
  const [{ data: reviews }, { data: discussionComments }, { data: pullRequest }] = await Promise.all([
    octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
      owner,
      repo,
      pull_number: pullNumber
    }),
    octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/comments', {
      owner,
      repo,
      issue_number: pullNumber
    }),
    octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner,
      repo,
      pull_number: pullNumber
    })
  ]);

  // Combine all text sources to search for issue references
  const allTexts = [
    pullRequest.body, // The PR description
    ...reviews.map((c: GithubComment) => c.body), // Review submission comments
    ...discussionComments.map((c: GithubComment) => c.body) // General discussion comments
  ].filter(Boolean) as string[];

  // Extract issue references from all texts
  const issueRefs = allTexts.flatMap((text) => extractIssueReferences(text));

  // Process each unique issue reference
  for (const ref of new Set(issueRefs)) {
    let issueOwner = owner;
    let issueRepo = repo;
    let issueNumber: number;

    // Parse cross-repo references
    if (ref.includes('/')) {
      const [repoRef, numRef] = ref.split('#');
      [issueOwner, issueRepo] = repoRef.split('/');
      issueNumber = parseInt(numRef);
    } else {
      issueNumber = parseInt(ref.replace('#', ''));
    }

    try {
      // First verify if there's a real connection between PR and issue
      const isReferenced = await verifyPRReferencesIssue({
        owner: issueOwner,
        repo: issueRepo,
        issueNumber,
        pullNumber
      });

      if (!isReferenced) {
        continue; // Skip if no real connection found
      }

      // Fetch issue details
      const { data: issue } = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
        owner: issueOwner,
        repo: issueRepo,
        issue_number: issueNumber
      });

      // Skip if this is actually a PR (GitHub treats PRs as issues)
      if (issue.pull_request) {
        continue;
      }

      const key = `${issueOwner}/${issueRepo}#${issueNumber}`;
      linkedIssues.set(key, {
        number: issueNumber,
        tags: Array.isArray(issue.labels)
          ? issue.labels
              .filter((label): label is GithubLabel => typeof label === 'object' && label !== null && 'name' in label)
              .map((label) => label.name)
          : []
      });

      break;
    } catch (error) {
      // Skip if issue doesn't exist or is inaccessible
      log.error('Error fetching issue', { error, issueOwner, issueRepo, issueNumber });
    }
  }

  return Array.from(linkedIssues.values())?.[0] ?? null;
}
