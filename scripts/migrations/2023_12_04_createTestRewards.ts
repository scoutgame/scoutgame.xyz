import { prisma } from '@charmverse/core/prisma-client';
import { MAX_EMBED_WIDTH } from 'components/common/CharmEditor/components/iframe/config';
import { VIDEO_ASPECT_RATIO } from 'components/common/CharmEditor/components/video/videoSpec';
import { Constants } from 'lib/focalboard/constants';
import { CREATED_AT_ID, DUE_DATE_ID, REWARDER_BLOCK_ID, REWARDS_APPLICANTS_BLOCK_ID, REWARDS_AVAILABLE_BLOCK_ID, REWARD_AMOUNT, REWARD_APPLICANTS_COUNT, REWARD_CHAIN, REWARD_CUSTOM_VALUE, REWARD_REVIEWERS_BLOCK_ID, REWARD_STATUS_BLOCK_ID, REWARD_TOKEN } from 'lib/rewards/blocks/constants';
import { upsertDefaultRewardsBoard } from 'lib/rewards/blocks/upsertDefaultRewardsBoard';
import { createReward } from 'lib/rewards/createReward';

export async function createTestRewards() {
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      createdBy: true,
      bounties: {
        select: {
          id: true
        },
        take: 1
      }
    }
  })

  for (const space of spaces) {
    if (space.bounties.length > 0) {
      continue;
    }

    await createReward({
      spaceId: space.id,
      userId: space.createdBy,
      customReward: "Custom Reward",
      reviewers: [
        {
          group: "user",
          id: space.createdBy
        }
      ],
      fields: {
        properties: {
          [REWARDS_APPLICANTS_BLOCK_ID]: [],
          [REWARDS_AVAILABLE_BLOCK_ID]: "",
          [CREATED_AT_ID]: "",
          [DUE_DATE_ID]: "",
          [REWARD_REVIEWERS_BLOCK_ID]: [
            {
              group: "user",
              id: space.createdBy
            }
          ],
          [REWARD_AMOUNT]: "",
          [REWARD_APPLICANTS_COUNT]: "0",
          [REWARD_CHAIN]: "",
          [REWARD_CUSTOM_VALUE]: "Custom Reward",
          [REWARD_STATUS_BLOCK_ID]: "",
          [REWARD_TOKEN]: "",
          [REWARDER_BLOCK_ID]: "",
          [Constants.titleColumnId]: "Demo Reward"
        }
      },
      pageProps: {
        type: "bounty",
        title: "Demo Reward",
        sourceTemplateId: null,
        headerImage: null,
        icon: null,
        contentText: "",
        content: {
          type: 'doc',
          content: [
            {
              type: 'iframe',
              attrs: {
                type: "embed",
                src: "https://tiny.charmverse.io/bounties",
                width: MAX_EMBED_WIDTH,
                height: MAX_EMBED_WIDTH / VIDEO_ASPECT_RATIO
              }
            }
          ]
        }
      }
    })

    await upsertDefaultRewardsBoard({ spaceId: space.id, userId: space.createdBy });
  }
}

createTestRewards();