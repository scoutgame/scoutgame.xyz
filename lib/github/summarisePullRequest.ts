import { log } from '@charmverse/core/log';
import type { PullRequestStatus, PullRequestSummary } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { askChatGPT } from 'lib/ai/askChatgpt';
import type { ChatGPTModel } from 'lib/ai/constants';

import { GITHUB_API_BASE_URL } from './constants';
import type { GithubUserName } from './getMergedPullRequests';
import type { PullRequestToQuery } from './getPullRequestFileChanges';
import { getPullRequestFileChanges } from './getPullRequestFileChanges';

type PullRequestFilePatch = {
  filename: string;
  additions: number;
  deletions: number;
  patch: string;
};

/**
 * @createdBy github username of pull request author
 * @summary Message used. Files changed should be delimited as {files}
 */
export type PullRequestSummaryWithFilePatches = Omit<PullRequestSummary, 'patches' | 'model'> & {
  patches: PullRequestFilePatch[];
  model: ChatGPTModel;
};

export function baseSummarisePRPrompt({ prTitle }: { prTitle: string }) {
  return `Please summarise the changes made within this pull request titled "${prTitle}:

  Produce a single paragraph that summarises the changes of this pull request.

  Infer the overall impact on the project.
  
  Here is a list of files that were changed, in JSON format:
  
  ----
  
  {files}
  `;
}

export type PullRequestToSummarise = PullRequestToQuery &
  GithubUserName &
  Pick<PullRequestSummary, 'prTitle' | 'status'>;
/**
 * Summarise the PR, and return the summary with metadata
 * @param params
 * @returns
 */
export async function summarisePullRequest(params: PullRequestToSummarise): Promise<PullRequestSummaryWithFilePatches> {
  const existingSummary = await prisma.pullRequestSummary.findFirst({
    where: {
      prNumber: params.prNumber,
      repoOwner: params.repoOwner,
      repoName: params.repoName
    }
  });

  if (existingSummary) {
    log.info(
      `Pull request summary already exists for ${GITHUB_API_BASE_URL}/${params.repoOwner}/${params.repoName}/pull/${params.prNumber}`
    );
    return existingSummary as PullRequestSummaryWithFilePatches;
  }

  const files = await getPullRequestFileChanges(params);

  const basePrompt = baseSummarisePRPrompt({ prTitle: params.prTitle });

  const selectedModel: ChatGPTModel = 'gpt4';

  const fullPrompt = basePrompt.replace('{files}', JSON.stringify(files, null, 2));

  const response = await askChatGPT({ prompt: fullPrompt, model: selectedModel });

  const persistedSummary = await prisma.pullRequestSummary.create({
    data: {
      prTitle: params.prTitle,
      prNumber: params.prNumber,
      repoOwner: params.repoOwner,
      repoName: params.repoName,
      status: params.status,
      patches: files,
      model: selectedModel,
      additions: files.reduce((acc, file) => acc + file.additions, 0),
      deletions: files.reduce((acc, file) => acc + file.deletions, 0),
      changedFiles: files.length,
      createdBy: params.githubUsername,
      prompt: basePrompt,
      promptTokens: response.inputTokens,
      summary: response.answer,
      summaryTokens: response.outputTokens
    }
  });

  return persistedSummary as PullRequestSummaryWithFilePatches;
}

// summarisePullRequest({
//   number: 4004,
//   repoOwner: 'charmverse',
//   repoName: 'app.charmverse.io',
//   githubUsername: 'motechFR',
//   status: 'merged'
// })
//   .then((obj) => console.log(obj.id))
//   .catch(console.error);
