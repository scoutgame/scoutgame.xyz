import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getReposByOwner } from '@packages/github/getReposByOwner';

// githubLogin is either the owner or fullName of a repo
export async function importReposByUser(githubLogin: string, partner?: string) {
  const repos = await getReposByOwner(githubLogin);
  const owner = githubLogin.split('/')[0];
  const name = githubLogin.split('/')[1];
  // retrieve a list of all the owners we have in the gitRepo database
  const reposInDBByOwner = await prisma.githubRepo.findMany({
    where: {
      owner,
      name
    },
    select: {
      id: true,
      owner: true,
      name: true,
      bonusPartner: true
    }
  });
  // if (reposInDBByOwner.length > 0) {
  //   console.log(
  //     'found existing repos for owner',
  //     githubLogin,
  //     reposInDBByOwner.map((r) => r.name)
  //   );
  // }
  const reposInDBById = await prisma.githubRepo.findMany({
    where: {
      id: {
        in: repos.map((r) => r.id)
      }
    }
  });
  const reposInDB = [...reposInDBById, ...reposInDBByOwner];
  const isOrg = repos.some((repo: any) => repo.owner.type === 'Organization');
  const notSaved = repos.filter((repo: any) => !reposInDB.some((r) => r.name === repo.name || r.id === repo.id));
  // save to DB
  if (notSaved.length > 0) {
    await prisma.githubRepo.createMany({
      data: notSaved.map((repo) => ({
        id: repo.id,
        owner: repo.owner.login,
        defaultBranch: repo.default_branch,
        name: repo.name,
        ownerType: isOrg ? 'org' : 'user',
        fork: repo.fork
      }))
    });
    log.info(
      `Imported new repos from ${githubLogin}:`,
      notSaved.map((r) => r.name)
    );
  }
  if (partner) {
    const result = await prisma.githubRepo.updateMany({
      where: {
        id: { in: repos.map((r) => r.id) }
      },
      data: { bonusPartner: partner }
    });
    log.info(`Updated ${result.count} repos with partner ${partner}`);
  }
}
