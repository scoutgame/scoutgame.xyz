import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'path';
import { uniq, sortBy } from 'lodash';
import { prisma } from '@charmverse/core/prisma-client';
import { getGithubUsers } from './getGithubUsers';
import { getRepositoryActivity } from './getRepositoryActivity';

const sourceFile = resolve(process.cwd(), './latest_repo_activity_2.json');

/**
 * Use this script to perform database searches.
 */

const cutoffDate = new Date('2024-06-01');

async function getRecentContributions() {
  // const commits = await getRepoCommits({ owner: 'charmverse', repo: 'app.charmverse.io' });
  // console.log('FIRST RESULT');
  const repos = await prisma.githubRepo.findMany({
    where: { handPicked: true }
  });
  // console.log('Repos', projects.map((p) => p.repo).flat().length);

  const repoActivity = await getRepositoryActivity({
    cutoffDate: cutoffDate,
    repos: repos.map((r) => `${r.owner}/${r.name}`)
  });
  // write to file
  await writeFile('recent_git_contributions.json', JSON.stringify(repoActivity, null, 2));
}

async function getAuthorsWithEmail() {
  const repos: any[] = JSON.parse((await readFile(sourceFile)).toString());
  console.log('Found', repos.length, 'repos from:', sourceFile);
  const authorList = new Set(repos.map(({ authors }) => authors).flat());
  console.log('Found', authorList.size, 'authors');
  const prs = repos
    .map(({ pullRequests, ...repo }) =>
      pullRequests.map((pr: any) => ({
        repo,
        pr: pr.node
      }))
    )
    .flat();
  const contributors = await getGithubUsers({ logins: Array.from(authorList) });
  console.log('Found', contributors.length, 'contributors');
  const withEmail = contributors.filter((c) => c.email);
  console.log('Found', withEmail.length, 'contributors with email');
  const prsWithAuthor = prs.filter((pr) => pr.pr.author?.email);
  const authors = prsWithAuthor.reduce<Record<string, any[]>>((acc, pr) => {
    acc[pr.pr.author.email] = acc[pr.pr.author.email] || [];
    acc[pr.pr.author.email].push(pr);
    return acc;
  }, {});
  const emails = Object.keys(authors);
  console.log('Found', emails.length, 'authors with email');
  // const githubUsers = await prisma.githubUser.findMany({
  //   where: {
  //     builderId: {
  //       not: null
  //     },
  //     email: {
  //       in: emails
  //     }
  //   }
  // });
  // const authorData = Object.entries(authors).filter(([email]) => !githubUsers.some((user) => user.email === email));
  // console.log('builders in SG', Object.keys(authors).length, githubUsers.length, authorData.length);
  // console.log('repos', prsWithAuthor.length, 'of', prs.length);
  // // export a CSV of authors with columns: email, PR Count, PR Repos
  // const csv = sortBy(authorData, ([, prs]) => -prs.length).map(([email, prs]: [string, any[]]) => {
  //   const author = authorList.find((a) => a.email === email);
  //   const mostRecentPr = sortBy(prs, (pr) => pr.pr.updatedAt).reverse()[0];
  //   return `${email},${author?.name},${prs.length},${mostRecentPr.repo.url.replace('https://github.com/', '')}`;
  // });
  // await writeFile('authors.csv', 'email,name,prs,repos\n' + csv.join('\n'));
}

getAuthorsWithEmail();
