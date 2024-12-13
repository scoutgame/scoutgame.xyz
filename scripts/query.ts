import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserByIds } from '@packages/farcaster/getFarcasterUserById';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';

async function query() {
  const scout = await prisma.scout.findMany({
    where: {
      farcasterId: {
        not: null
      }
    }
  });
  console.log(scout.length);
  const results = [];
  // Process scouts in chunks of 100
  for (let i = 0; i < scout.length; i += 100) {
    const chunk = scout.slice(i, i + 100);
    const farcasterIds = chunk.map((s) => s.farcasterId!);

    const profiles = await getFarcasterUserByIds(farcasterIds);

    // Create a map of fid to follower count for efficient lookup
    const followerCountMap = profiles.reduce(
      (acc, f) => {
        acc[f.fid] = f.follower_count;
        return acc;
      },
      {} as Record<number, number>
    );

    for (const s of chunk) {
      results.push({
        id: s.farcasterId,
        name: s.farcasterName,
        bio: s.bio,
        followers: followerCountMap[s.farcasterId!] || 0
      });
    }

    console.log('Processed scouts', i + chunk.length, 'of', scout.length);
  }
  // write to tsv
  const tsv = stringify(results, { header: true, columns: ['id', 'name', 'bio', 'followers'] });
  fs.writeFileSync('farcaster_scout_profiles.tsv', tsv);
}

query();
