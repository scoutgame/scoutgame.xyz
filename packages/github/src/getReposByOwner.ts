// Function to fetch repos for a given owner
import { getOctokit } from './client';

export type GitHubAPIRepo = {
  id: number;
  default_branch: string;
  full_name: string;
  html_url: string;
  name: string;
  fork: boolean;
  owner: { login: string; type: string };
};

export async function getReposByOwner(ownerInput: string): Promise<GitHubAPIRepo[]> {
  const ownerAndName = ownerInput.split('/');
  const owner = ownerAndName[0];
  const name = ownerAndName[1]; // name is optional

  const octokit = getOctokit();

  if (name) {
    // Fetch a specific repository
    const response = await octokit.rest.repos.get({
      owner,
      repo: name
    });
    return [response.data as GitHubAPIRepo];
  } else {
    // Fetch all repositories for a user/organization using pagination
    const repos = await octokit.paginate(octokit.rest.repos.listForUser, {
      username: owner,
      per_page: 100,
      type: 'all' // Include all repos (public, private if authenticated)
    });

    return repos as GitHubAPIRepo[];
  }
}
