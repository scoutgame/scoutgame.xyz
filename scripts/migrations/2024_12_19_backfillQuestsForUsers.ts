// @ts-nocheck
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { recordNftPurchaseQuests } from '@packages/scoutgame/builderNfts/recordNftPurchaseQuests';
import { completeQuests } from '@packages/scoutgame/quests/completeQuests';
import { QuestType } from '@packages/scoutgame/quests/questRecords';

async function backfillQuestsForScouts() {
  const scouts = await prisma.scout.findMany({
    where: {
      nftPurchaseEvents: {
        some: {
          builderNft: {
            season: getCurrentSeasonStart()
          }
        }
      }
    },
    select: {
      id: true
    }
  });

  for (const scout of scouts) {
    try {
      await recordNftPurchaseQuests(scout.id);
    } catch (error) {
      log.error(`Error recording NFT purchase quests for scout ${scout.id}`, error);
    }
  }
}

async function backfillQuestsForBuilders() {
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: {
        not: null
      }
    },
    select: {
      id: true,
      githubUsers: {
        select: {
          events: {
            where: {
              type: {
                in: ['commit', 'merged_pull_request']
              }
            },
            select: {
              builderEvent: {
                select: {
                  gemsReceipt: {
                    select: {
                      type: true
                    }
                  }
                }
              },
              type: true,
              repo: {
                select: {
                  bonusPartner: true
                }
              }
            }
          }
        }
      }
    }
  });

  for (const builder of builders) {
    try {
      const commitsCount = builder.githubUsers
        .flatMap((user) => user.events)
        .filter((event) => event.type === 'commit').length;
      const prsCount = builder.githubUsers
        .flatMap((user) => user.events)
        .filter((event) => event.type === 'merged_pull_request').length;
      const prStreaks = builder.githubUsers
        .flatMap((user) => user.events)
        .filter((event) => event.builderEvent?.gemsReceipt?.type === 'third_pr_in_streak');

      let contributedToCeloRepo = false,
        contributedToGame7Repo = false,
        contributedToLitProtocolRepo = false;

      builder.githubUsers
        .flatMap((user) => user.events)
        .filter((event) => event.repo?.bonusPartner)
        .forEach((event) => {
          const bonusPartner = event.repo?.bonusPartner;
          if (bonusPartner === 'celo') {
            contributedToCeloRepo = true;
          } else if (bonusPartner === 'game7') {
            contributedToGame7Repo = true;
          } else if (bonusPartner === 'lit_protocol') {
            contributedToLitProtocolRepo = true;
          } else if (bonusPartner === 'octant') {
            contributedToOctantRepo = true;
          }
        });

      const questTypes: QuestType[] = [];

      if (commitsCount >= 1) {
        questTypes.push('score-first-commit');
      }

      if (prsCount >= 1) {
        questTypes.push('score-first-pr');
        questTypes.push('first-repo-contribution');
      }

      if (prStreaks.length >= 1) {
        questTypes.push('score-streak');
      }

      if (contributedToCeloRepo) {
        questTypes.push('contribute-celo-repo');
      }

      if (contributedToGame7Repo) {
        questTypes.push('contribute-game7-repo');
      }

      if (contributedToLitProtocolRepo) {
        questTypes.push('contribute-lit-repo');
      }

      if (contributedToOctantRepo) {
        questTypes.push('contribute-octant-repo');
      }

      await completeQuests(builder.id, questTypes);
    } catch (error) {
      log.error(`Error recording builder activity quests for builder ${builder.id}`, error);
    }
  }
}

// backfillQuestsForScouts().then(() => {
//   log.info('backfillQuestsForScouts complete');
// });

backfillQuestsForBuilders().then(() => {
  log.info('backfillQuestsForBuilders complete');
});
