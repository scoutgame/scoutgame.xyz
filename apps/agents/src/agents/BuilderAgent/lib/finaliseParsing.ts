import fs from 'node:fs/promises';
import path from 'node:path';

const sourceFolder = path.resolve('apps/agents/src/agents/BuilderAgent/lib/enriched');

const targetFile = path.resolve('apps/agents/src/agents/BuilderAgent/tools/searchRepos/repos-enriched.json');

async function finaliseParsing() {
  // Read all files in source directory
  const files = await fs.readdir(sourceFolder);

  // Filter for .json files and parse them
  const jsonData = await Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .map(async (file) => {
        const filePath = path.join(sourceFolder, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        return JSON.parse(fileContent);
      })
  );

  // Write combined data to target file
  await fs.writeFile(targetFile, JSON.stringify(jsonData, null, 2));
}

// finaliseParsing();
