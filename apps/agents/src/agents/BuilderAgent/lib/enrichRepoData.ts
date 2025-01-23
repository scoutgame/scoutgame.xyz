import fs from 'fs';
import path from 'node:path';

import { log } from '@charmverse/core/log';
import { tokenize } from '@packages/llm/tokenize';
import { GET, POST } from '@packages/utils/http';
import { prettyPrint } from '@packages/utils/strings';

import { parseFileTreeFromGitingest } from './parseFileTreeFromGitingest';

function normaliseRepoNameAndOwner({ repoOwner, repoName }: { repoOwner: string; repoName: string }) {
  return `${repoOwner}_${repoName}`;
}

/**
 * We are using the DeepSeek Chat model which has max 64k tokens, so we leave some buffer
 */
const MAX_TOKENS = 60_000;

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

  // fs.writeFileSync(downloadFilePath, downloadResponse.data);

  // // Step 3: Parse directory structure and load files
  // const fileContent = fs.readFileSync(downloadFilePath, 'utf-8');
  // const files = parseFiles(fileContent); // Implement parseFiles to extract file paths
  // const concatenatedFiles = concatenateFiles(files); // Implement concatenateFiles to handle file loading and concatenation

  // // Step 4: Send API call to deepseek chat
  // const deepseekResponse = await axios.post('https://deepseek.com/api/chat', {
  //   prompt: 'Explain the repository',
  //   input: concatenatedFiles
  // });

  // const result = {
  //   topics: deepseekResponse.data.topics,
  //   summary: deepseekResponse.data.description
  // };

  // // Step 5: Write result to JSON file
  // fs.writeFileSync(enrichedFilePath, JSON.stringify(result, null, 2));

  // return result;
}

enrichRepoData({ repoOwner: 'scoutgame', repoName: 'scoutgame.xyz' })
  .then((result) => {
    log.info('result', result);
  })
  .catch((error) => {
    prettyPrint({ error });
  });
