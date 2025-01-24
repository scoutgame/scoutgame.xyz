import { prisma } from '@charmverse/core/prisma-client';
import { writeFile } from 'fs/promises';
import { GET } from '@charmverse/core/http';
import { DateTime } from 'luxon';

async function query() {
  const repos = await prisma.githubRepo.findMany({
    where: {
      ownerType: 'org',
      deletedAt: null,
      events: {
        some: {
          githubUser: {
            builderId: {
              not: null
            }
          }
        }
      }
    },
    orderBy: [
      {
        owner: 'asc'
      },
      {
        name: 'asc'
      }
    ],
    select: {
      id: true,
      owner: true,
      name: true
    }
  });

  console.log('Found', repos.length, 'active repos');

  // Add extra misc fields to repo
  const reposFormatted = repos.map((repo) => ({
    ...repo,
    url: `https://github.com/${repo.owner}/${repo.name}`
  }));

  // Fetch README contents for each repo
  const reposWithMeta: any[] = [];

  for (const repo of reposFormatted) {
    let result = {
      ...repo,
      url: `https://github.com/${repo.owner}/${repo.name}`
    };
    try {
      // Rate limit to 100 requests per second
      await new Promise((resolve) => setTimeout(resolve, 10));

      const metadata = await GET<any>(`https://api.github.com/repos/${repo.owner}/${repo.name}`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`
        }
      });

      // console.log('metadata', metadata);

      // add some interesting metadata
      Object.assign(result, {
        topics: metadata.topics,
        description: metadata.description,
        language: metadata.language
      });

      // retrieve the README
      await new Promise((resolve) => setTimeout(resolve, 10));

      const readmeData = await GET<{ content: string }>(
        `https://api.github.com/repos/${repo.owner}/${repo.name}/readme`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`
          }
        }
      );

      const readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      Object.assign(result, {
        readme: readmeContent
      });
    } catch (error) {
      console.error(`Error fetching README for ${repo.owner}/${repo.name}:`, error);
    }
    reposWithMeta.push(result);
    if (reposFormatted.indexOf(repo) % 10 === 0) {
      console.log('Processed', reposFormatted.indexOf(repo), 'repos');
    }
  }

  await writeFile('repos.json', JSON.stringify(reposWithMeta, null, 2));
  console.log('Wrote', reposWithMeta.length, 'repos to file');
}

query();
