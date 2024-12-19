import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';
import { recordNftPurchaseQuests } from '@packages/scoutgame/builderNfts/recordNftPurchaseQuests';
import { completeQuest } from '@packages/scoutgame/quests/completeQuest';

async function backfillQuestsForScouts() {
  const scouts = await prisma.scout.findMany({
    where: {
      nftPurchaseEvents: {
        some: {
          builderNft: {
            season: currentSeason
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
  })

  for (const builder of builders) {
    try {
      const commitsCount = builder.githubUsers.flatMap((user) => user.events).filter((event) => event.type === 'commit').length;
      const prsCount = builder.githubUsers.flatMap((user) => user.events).filter((event) => event.type === 'merged_pull_request').length;
      const prStreaks = builder.githubUsers.flatMap(user => user.events).filter(event => event.builderEvent?.gemsReceipt?.type === "third_pr_in_streak");

      let contributedToCeloRepo = false, contributedToGame7Repo = false, contributedToLitProtocolRepo = false;


      builder.githubUsers.flatMap(user => user.events).filter(event => event.repo?.bonusPartner).forEach(event => {
        const bonusPartner = event.repo?.bonusPartner;
        if (bonusPartner === 'celo') {
          contributedToCeloRepo = true;
        } else if (bonusPartner === 'game7') {
          contributedToGame7Repo = true;
        } else if (bonusPartner === 'lit_protocol') {
          contributedToLitProtocolRepo = true;
        }
      })

      if (commitsCount >= 1) {
        await completeQuest(builder.id, 'score-first-commit');
      }

      if (prsCount >= 1) {
        await completeQuest(builder.id, 'score-first-pr');
        await completeQuest(builder.id, 'first-repo-contribution')
      }

      if (prStreaks.length >= 1) {
        await completeQuest(builder.id, 'score-streak');
      }

      if (contributedToCeloRepo) {
        await completeQuest(builder.id, 'contribute-celo-repo');
      }

      if (contributedToGame7Repo) {
        await completeQuest(builder.id, 'contribute-game7-repo');
      }

      if (contributedToLitProtocolRepo) {
        await completeQuest(builder.id, 'contribute-lit-repo');
      }
    } catch (error) {
      log.error(`Error recording builder activity quests for builder ${builder.id}`, error);
    }
  }
}

backfillQuestsForScouts().then(() => {
  log.info('backfillQuestsForScouts complete');
});

backfillQuestsForBuilders().then(() => {
  log.info('backfillQuestsForBuilders complete');
});