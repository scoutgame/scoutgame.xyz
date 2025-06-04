import { octokit } from '@packages/github/client';

type LinkedIssue = {
  number: number;
  repository: {
    id: number;
    nameWithOwner: string;
  };
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

interface GithubIssue {
  number: number;
  repository: {
    id: number;
  };
  labels: GithubLabel[];
}

interface TimelineEvent {
  event: 'cross-referenced';
  source: {
    issue: {
      number: number;
    };
  };
}

/**
 * Extracts issue numbers from GitHub comment text using regex
 */
function extractIssueReferences(text: string): string[] {
  // Match both forms: #123 and owner/repo#123
  const issueRegex = /(?:^|\s)(?:([a-zA-Z0-9-]+\/[a-zA-Z0-9-]+))?#(\d+)(?:\s|$)/g;
  const matches: string[] = [];

  // Using for...of with matchAll instead of while loop to satisfy linter
  for (const match of text.matchAll(issueRegex)) {
    if (match[1]) {
      // Cross-repository reference
      matches.push(`${match[1]}#${match[2]}`);
    } else {
      // Same repository reference
      matches.push(`#${match[2]}`);
    }
  }

  return matches;
}

/**
 * Fetches all linked issues for a pull request by analyzing comments and cross-references
 */
export async function getLinkedIssues({
  owner,
  repo,
  pullNumber
}: {
  owner: string;
  repo: string;
  pullNumber: number;
}): Promise<LinkedIssue[]> {
  const linkedIssues = new Map<string, LinkedIssue>();

  // 1. Fetch inline review comments (comments on specific lines of code)
  const { data: inlineComments } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/comments', {
    owner,
    repo,
    pull_number: pullNumber
  });

  // 2. Fetch review submissions (overall review comments when approving/requesting changes)
  const { data: reviews } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
    owner,
    repo,
    pull_number: pullNumber
  });

  // 3. Fetch general discussion comments (comments in the Conversation tab)
  const { data: discussionComments } = await octokit.request(
    'GET /repos/{owner}/{repo}/issues/{issue_number}/comments',
    {
      owner,
      repo,
      issue_number: pullNumber
    }
  );

  // 4. Fetch PR body
  const { data: pullRequest } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
    owner,
    repo,
    pull_number: pullNumber
  });

  // Combine all text sources to search for issue references
  const allTexts = [
    pullRequest.body, // The PR description
    ...inlineComments.map((c: GithubComment) => c.body), // Comments on specific lines
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
      // Verify issue exists and is linked to the PR
      const { data: issue } = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
        owner: issueOwner,
        repo: issueRepo,
        issue_number: issueNumber
      });

      // Check if the issue is actually linked to this PR
      const { data: timeline } = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/timeline', {
        owner: issueOwner,
        repo: issueRepo,
        issue_number: issueNumber,
        mediaType: {
          previews: ['mockingbird'] // Required for the timeline API
        }
      });

      const isLinked = timeline.some((event: any) => {
        if (event.event !== 'cross-referenced') return false;
        return event.source?.issue?.number === pullNumber;
      });

      if (isLinked) {
        const key = `${issueOwner}/${issueRepo}#${issueNumber}`;
        linkedIssues.set(key, {
          number: issueNumber,
          repository: {
            id: issue.repository?.id || 0, // Fallback if repository ID is not available
            nameWithOwner: `${issueOwner}/${issueRepo}`
          },
          tags: Array.isArray(issue.labels)
            ? issue.labels
                .filter((label): label is GithubLabel => typeof label === 'object' && label !== null && 'name' in label)
                .map((label) => label.name)
            : []
        });
      }
    } catch (error) {
      // Skip if issue doesn't exist or is inaccessible
      continue;
    }
  }

  return Array.from(linkedIssues.values());
}

// getLinkedIssues({
//   owner: 'shutter-network',
//   repo: 'observer',
//   pullNumber: 79
// }).then(console.log);
