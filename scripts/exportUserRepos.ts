import { prisma } from '@charmverse/core/prisma-client';
import fs from 'fs';

async function query() {
  // Query all repos with ownerType: 'user' and include builder events and unique builders
  const repos = await prisma.githubRepo.findMany({
    where: {
      ownerType: 'user'
    },
    select: {
      id: true,
      name: true,
      owner: true,
      createdAt: true,
      events: {
        select: {
          builderEvent: {
            select: {
              builderId: true
            }
          }
        }
      }
    }
  });

  // Process the data to get counts and format for TSV
  const repoStats = repos
    .map((repo) => {
      const totalEvents = repo.events.length;
      const uniqueBuilders = new Set(repo.events.map((event) => event.builderEvent?.builderId)).size;
      const createdDate = repo.createdAt.toISOString().split('T')[0]; // Format as YYYY-MM-DD

      return {
        repoName: repo.name,
        owner: repo.owner,
        fullName: repo.owner + '/' + repo.name,
        createdDate,
        totalEvents,
        uniqueBuilders
      };
    })
    .sort((a, b) => b.totalEvents - a.totalEvents);
  console.log('have events', repoStats.filter((s) => s.totalEvents > 0).length);
  console.log('have builders', repoStats.filter((s) => s.uniqueBuilders > 1).length);
  // Create TSV content
  const headers = ['Repository Full Name', 'Owner', 'Created Date', 'Total Events', 'Unique Builders'];
  const rows = repoStats.map((stat) =>
    [stat.fullName, stat.owner, stat.createdDate, stat.totalEvents, stat.uniqueBuilders].join('\t')
  );

  console.log(rows.length, 'rows');

  const tsvContent = [headers.join('\t'), ...rows].join('\n');

  // Write to file
  const fileName = `user_repos_stats_${new Date().toISOString().split('T')[0]}.tsv`;

  fs.writeFileSync(fileName, tsvContent);
  console.log(`TSV file created: ${fileName}`);
}

query();
