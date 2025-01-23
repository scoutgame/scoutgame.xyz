import fs from 'fs';
import path from 'node:path';

import { log } from '@charmverse/core/log';
import { tokenize } from '@packages/llm/tokenize';
import { GET, POST } from '@packages/utils/http';
import { prettyPrint } from '@packages/utils/strings';

import type { GithubFileNode } from './parseFileTreeFromGitingest';
import { parseFileTreeFromGitingest } from './parseFileTreeFromGitingest';

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
const MAX_TOKENS = 60_000;

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
  `;
}

export async function enrichRepoData({ repoOwner, repoName }: { repoOwner: string; repoName: string }) {
  const repoId = normaliseRepoNameAndOwner({ repoOwner, repoName });

  const enrichedDir = path.resolve('apps/agents/src/agents/BuilderAgent/lib/enriched');

  if (!fs.existsSync(enrichedDir)) {
    fs.mkdirSync(enrichedDir, { recursive: true });
  }

  const enrichedFilePath = path.resolve(enrichedDir, `${repoId}.json`);

  // Check if repo data already exists
  if (fs.existsSync(enrichedFilePath)) {
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
    formData.append('pattern', '*.ts,*.py,*.sol');
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

  const fileTree = parseFileTreeFromGitingest(rawData);

  let llmProjectContext = '';

  // Perform BFS through file tree to build context
  const queue: { node: GithubFileNode; path: string }[] = [];

  let totalTokens = 0;

  // Start with root's children
  if (fileTree.children) {
    fileTree.children.forEach((child) => {
      queue.push({
        node: child,
        path: child.name
      });
    });
  }

  while (queue.length > 0) {
    const { node, path: filePath } = queue.shift()!;

    // Add children to queue
    if (node.children) {
      node.children.forEach((child) => {
        queue.push({
          node: child,
          path: `${filePath}/${child.name}`
        });
      });
    }

    // Process content if exists
    if (node.content) {
      // Rough token estimation (4 chars per token)
      const estimatedTokens = await tokenize({ text: node.content });

      if (totalTokens + estimatedTokens > MAX_TOKENS) {
        break;
      }

      llmProjectContext += `File: ${path}\n${node.content}\n\n`;
      totalTokens += estimatedTokens;
    }
  }

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

  prettyPrint({ deepseekResponse });

  // const result = {
  //   topics: deepseekResponse.data.topics,
  //   summary: deepseekResponse.data.description
  // };

  // // Step 5: Write result to JSON file
  // fs.writeFileSync(enrichedFilePath, JSON.stringify(result, null, 2));

  // return result;
}

// enrichRepoData({ repoOwner: 'scoutgame', repoName: 'scoutgame.xyz' })
//   .then((result) => {
//     log.info('result', result);
//   })
//   .catch((error) => {
//     prettyPrint({ error });
//   });
