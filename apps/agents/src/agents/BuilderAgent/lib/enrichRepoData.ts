import fs from 'fs';
import path from 'node:path';

import { log } from '@charmverse/core/log';
import { tokenize } from '@packages/llm/tokenize';
import { GET, POST } from '@packages/utils/http';
import { prettyPrint } from '@packages/utils/strings';

import type { GithubFileNode } from './parseFileTreeFromGitingest';
import { parseFileTreeFromGitingest } from './parseFileTreeFromGitingest';

type RepoSummary = {
  topics: string[];
  summary: string;
};

function normaliseRepoNameAndOwner({ repoOwner, repoName }: { repoOwner: string; repoName: string }) {
  return `${repoOwner}_${repoName}`;
}

type DeepseekResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    logprobs: null;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details: {
      cached_tokens: number;
    };
    prompt_cache_hit_tokens: number;
    prompt_cache_miss_tokens: number;
  };
  system_fingerprint: string;
};

/**
 * We are using the DeepSeek Chat model which has max 64k tokens, so we leave some buffer
 */
const MAX_TOKENS = 58_000;

function getDeepseekPrompt(llmProjectContext: string) {
  return `
Please summarise what this github code does as a product

And a human friendly description with 200 - 400 words around the key functionality.

Also output the key topics. The topics should be product / web3 categories that the repository fits into, not a list of technical capabilities.

Expected output format is JSON object with the following fields:

{
  topics: string[]
  summary: string
}


Here is the code:

${llmProjectContext}
  `;
}

function makeCompact(content: string): string {
  // Remove extra spaces and make the content more compact
  return content
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .replace(/\n\s+/g, '\n') // Remove leading spaces after newlines
    .trim(); // Trim the start and end of the content
}

export async function enrichRepoData({
  repoOwner,
  repoName,
  forceReprocessing
}: {
  repoOwner: string;
  repoName: string;
  forceReprocessing?: boolean;
}) {
  const repoId = normaliseRepoNameAndOwner({ repoOwner, repoName });

  const enrichedDir = path.resolve('apps/agents/src/agents/BuilderAgent/lib/enriched');

  if (!fs.existsSync(enrichedDir)) {
    fs.mkdirSync(enrichedDir, { recursive: true });
  }

  const enrichedFilePath = path.resolve(enrichedDir, `${repoId}.json`);

  // Check if repo data already exists
  if (fs.existsSync(enrichedFilePath) && !forceReprocessing) {
    return JSON.parse(fs.readFileSync(enrichedFilePath, 'utf-8'));
  }

  // Step 1: POST request to gitingest
  const ingestedFileTxtPath = path.join(enrichedDir, `${repoId}.txt`);

  if (!fs.existsSync(ingestedFileTxtPath)) {
    log.info('Ingesting repo data for', repoId);
    const ingestUrl = `https://gitingest.com/${repoOwner}/${repoName}`;
    const formData = new FormData();
    formData.append('max_file_size', '243');
    formData.append('pattern_type', 'include');
    formData.append('pattern', '*.ts,*.tsx,*.py,*.sol');
    formData.append('input_text', `${repoOwner}/${repoName}`);

    const response = await POST<string>(ingestUrl, formData, {
      skipStringifying: true,
      noHeaders: true
    });

    // Step 2: Search for download link in response HTML
    const downloadLinkMatch = response.match(/<a href="\/download\/([^"]+)"/);
    if (!downloadLinkMatch) {
      throw new Error('Download link not found in response');
    }
    const downloadUrl = `https://gitingest.com/download/${downloadLinkMatch[1]}`;

    log.info('downloadUrl', downloadUrl);

    const downloadResponse = await GET<ArrayBuffer>(downloadUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(ingestedFileTxtPath, String(downloadResponse));
  }

  const rawData = fs.readFileSync(ingestedFileTxtPath, 'utf-8');

  const fileTree = parseFileTreeFromGitingest(rawData, [
    // Test and Mock-related directories
    '__tests__',
    '__e2e__',
    '__mocks__',
    'test',
    '__tests__',
    'spec.ts',
    'jest',
    // Configuration and temporary files
    'config',
    'temp',
    'tmp',
    'sandbox',

    // Build and output directories
    'build',
    'dist',
    'bin',
    'obj',
    'coverage',

    // Type defs
    '.d.ts',

    // Package manager and tool-specific directories
    'node_modules',
    '.git',
    '.github',
    '.idea',
    '.vscode',

    // Logs and cache directories
    'logs',

    // Documentation and sample files
    'docs',
    'examples',
    'samples',
    'scripts',

    // System files
    '.DS_Store',

    // Cloud provider directories
    'aws',
    '.cdk',

    // Docker and deployment directories
    'docker'
  ]);

  let llmProjectContext = '';

  // Perform BFS through file tree to build context
  const queue: { node: GithubFileNode; filePath: string }[] = [];

  let totalTokens = 0;
  let totalFiles = 0;

  // Start with root's children
  if (fileTree.children) {
    fileTree.children.forEach((child) => {
      queue.push({
        node: child,
        filePath: child.name
      });
    });
  }

  let maxTokensReached = false;

  while (queue.length > 0) {
    const { node, filePath } = queue.shift()!;

    // Add children to queue
    if (node.children) {
      node.children.forEach((child) => {
        // 50% chance to skip this child's children and just process its content
        const skipChildren = Math.random() < 0.4;

        queue.push({
          node: {
            ...child,
            // Remove children if we're skipping them
            children: skipChildren ? undefined : child.children
          },
          filePath: `${filePath}/${child.name}`
        });
      });
    }

    // Process content if exists
    if (node.content) {
      const compactedContent = makeCompact(`File: ${filePath}\n${node.content}\n\n`);
      // const compactedContent = node.content;

      // Rough token estimation (4 chars per token)
      const estimatedTokens = await tokenize({ text: compactedContent });

      if (totalTokens + estimatedTokens > MAX_TOKENS) {
        maxTokensReached = true;
        log.info(`Max tokens reached, stopping with ${totalFiles} files and ${totalTokens} tokens`);
        break;
      }

      totalFiles += 1;

      llmProjectContext += compactedContent;
      totalTokens += estimatedTokens;
    }
  }

  if (!maxTokensReached) {
    log.info('Exhausted tokens, stopping with', totalFiles, 'files and', totalTokens, 'tokens');
  }

  // process.exit(0);

  // fs.writeFileSync(downloadFilePath, downloadResponse.data);

  // Step 4: Send API call to deepseek chat
  const deepseekResponse = await POST<DeepseekResponse>(
    'https://api.deepseek.com/chat/completions',
    {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: getDeepseekPrompt(llmProjectContext) }
      ],
      temperature: 0.2,
      response_format: {
        type: 'json_object',
        schema: {
          type: 'object',
          properties: {
            topics: {
              type: 'array',
              items: { type: 'string' }
            },
            summary: { type: 'string' }
          },
          required: ['topics', 'summary']
        }
      },
      stream: false
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.SCOUT_AGENT_DEEPSEEK_API_KEY}`
      }
    }
  );

  const parsedResult = JSON.parse(deepseekResponse.choices[0].message.content) as RepoSummary;

  fs.writeFileSync(enrichedFilePath, JSON.stringify(parsedResult, null, 2));

  return parsedResult;
}

async function processRepo(repoOwner: string, repoName: string) {
  const [firstSummary, secondSummary] = await Promise.all([
    enrichRepoData({ repoOwner, repoName, forceReprocessing: true }),
    enrichRepoData({ repoOwner, repoName, forceReprocessing: true })
  ]);

  const finalSummary = await POST<DeepseekResponse>(
    'https://api.deepseek.com/chat/completions',
    {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant who summarise Github repository summaries.' },
        {
          role: 'user',
          content: `
Please aggregate these two summaries into a single summary and topics list.

Remove any generic tags such as "web3" or "blockchain" as well as any tags relating to purely technical matters:

The final summary should be about 200 - 400 words and focus on what the actual product is.

Summary 1: ${JSON.stringify(firstSummary)}

Summary 2: ${JSON.stringify(secondSummary)}

Expected output format is JSON object with the following fields:
{
  topics: string[]
  summary: string
}`
        }
      ],
      temperature: 0.2,
      response_format: {
        type: 'json_object',
        schema: {
          type: 'object',
          properties: {
            topics: {
              type: 'array',
              items: { type: 'string' }
            },
            summary: { type: 'string' }
          },
          required: ['topics', 'summary']
        }
      },
      stream: false
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.SCOUT_AGENT_DEEPSEEK_API_KEY}`
      }
    }
  ).then((response) => JSON.parse(response.choices[0].message.content) as RepoSummary);

  return finalSummary;
}

// TODO

// Fix the github file filtering to ignore config, aws and other files that dont provide value

processRepo('scoutgame', 'scoutgame.xyz')
  .then((result) => {
    log.info('result', result);
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
  });
