import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { RateLimit } from 'async-sema';
import { v4 } from 'uuid';

// 10 notifications per second, there are no specific rate limits mentioned in the docs
const rateLimiter = RateLimit(25);

type Variables = {
  weekly_claim: {
    tokens: number;
  };
  draft_transaction_failed: undefined;
  zero_weekly_claim: undefined;
  builder_suspended: undefined;
  nft_transaction_failed: {
    builderName: string;
    builderPath: string;
  };
  builder_card_scouted: {
    scouterName: string;
    scouterPath: string;
  };
  builder_approved: undefined;
  referral_link_signup: {
    refereeName: string;
    refereePath: string;
  };
  merged_pr_gems: {
    gems: number;
    partnerRewards?: string;
  };
  developer_rank_change: undefined;
  added_to_project: {
    projectName: string;
    projectPath: string;
  };
};

const FarcasterNotificationTypesRecord = {
  weekly_claim: {
    title: 'Weekly Claim',
    description: ({ tokens }: Variables['weekly_claim']) =>
      `You earned ${tokens} DEV tokens this week! Click to Claim!`,
    targetUrl: () => `https://scoutgame.xyz/claim`
  },
  zero_weekly_claim: {
    title: 'A New Week, A New Opportunity',
    description: () => 'A new week means a fresh opportunity to earn rewards. Start playing.',
    targetUrl: () => `https://scoutgame.xyz/quests`
  },
  builder_suspended: {
    title: 'Developer suspended',
    description: () => `Your developer card has been suspended`,
    targetUrl: () => `https://scoutgame.xyz/info/spam-policy`
  },
  nft_transaction_failed: {
    title: 'NFT transaction failed',
    description: ({ builderName }: Variables['nft_transaction_failed']) =>
      `our transaction failed when purchasing ${builderName}. Try again`,
    targetUrl: ({ builderPath }: Variables['nft_transaction_failed']) => `https://scoutgame.xyz/u/${builderPath}`
  },
  draft_transaction_failed: {
    title: 'Draft transaction failed',
    description: () => `The transaction for your bid at the Developer Draft has failed. Please try again.`,
    targetUrl: () => `https://scoutgame.xyz/draft/register`
  },
  builder_card_scouted: {
    title: 'Developer card scouted',
    description: ({ scouterName }: Variables['builder_card_scouted']) =>
      `Your developer card has been scouted by ${scouterName}`,
    targetUrl: ({ scouterPath }: Variables['builder_card_scouted']) => `https://scoutgame.xyz/u/${scouterPath}`
  },
  builder_approved: {
    title: 'Developer approved',
    description: () => `You have been approved as a Scout Game Developer`,
    targetUrl: () => `https://scoutgame.xyz/profile`
  },
  referral_link_signup: {
    title: 'Referral link signup',
    description: ({ refereeName }: Variables['referral_link_signup']) =>
      `Your referee ${refereeName} signed up using your referral link. Claim your rewards on Monday!`,
    targetUrl: ({ refereePath }: Variables['referral_link_signup']) => `https://scoutgame.xyz/u/${refereePath}`
  },
  merged_pr_gems: {
    title: 'You got gems!',
    description: ({ gems, partnerRewards }: Variables['merged_pr_gems']) =>
      `You earned ${gems} gems ${partnerRewards ? ` and ${partnerRewards}` : ''} for merging a PR`,
    targetUrl: () => `https://scoutgame.xyz/profile`
  },
  developer_rank_change: {
    title: 'Your developers are on the move!',
    description: () => 'Your developers are moving in the leaderboard rankings. Check them out!',
    targetUrl: () => `https://scoutgame.xyz/scout`
  },
  added_to_project: {
    title: 'Added to project',
    description: ({ projectName }: Variables['added_to_project']) =>
      `You have been added to the project ${projectName}`,
    targetUrl: ({ projectPath }: Variables['added_to_project']) => `https://scoutgame.xyz/p/${projectPath}`
  }
};

export type FarcasterNotificationVariables<T extends keyof typeof FarcasterNotificationTypesRecord> = Variables[T];

export async function sendFarcasterNotification<T extends keyof typeof FarcasterNotificationTypesRecord>({
  userId,
  notificationType,
  notificationVariables
}: {
  userId: string;
  notificationType: T;
  notificationVariables: Variables[T];
}) {
  const notification = FarcasterNotificationTypesRecord[notificationType];

  if (!notification) {
    log.debug('Invalid notification type, not sending farcaster notification', { userId, notificationType });
    return false;
  }

  const user = await prisma.scout.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      farcasterId: true,
      sendFarcasterNotification: true,
      framesNotificationToken: true
    }
  });

  if (!user.farcasterId) {
    log.debug('User has no farcaster id, not sending farcaster notification', { userId });
    return false;
  }

  if (!user.sendFarcasterNotification) {
    log.debug('User has no farcaster notification preference, not sending farcaster notification', { userId });
    return false;
  }

  if (!user.framesNotificationToken) {
    log.debug('User has no frames notification token, not sending farcaster notification', { userId });
    return false;
  }

  const body = notification.description(notificationVariables as any);
  const targetUrl = notification.targetUrl(notificationVariables as any);

  const notificationId = v4();

  const title = notification.title;

  log.debug('Sending farcaster notification', {
    userId,
    title,
    notificationType
  });

  await rateLimiter();

  const response = await fetch('https://api.warpcast.com/v1/frame-notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tokens: [user.framesNotificationToken],
      title,
      body,
      targetUrl,
      notificationId
    })
  });

  const data = (await response.json()) as {
    result: {
      successTokens: string[];
      invalidTokens: string[];
      rateLimitedTokens: string[];
    };
  };

  if (data.result.rateLimitedTokens.includes(user.framesNotificationToken)) {
    log.debug('Rate limited when sending farcaster notification', { userId });
    return false;
  }

  // The token is not valid anymore, so we need to remove it
  if (data.result.invalidTokens.includes(user.framesNotificationToken)) {
    await prisma.scout.update({
      where: {
        id: userId
      },
      data: {
        framesNotificationToken: null
      }
    });
    log.debug('Invalid frames notification token', { userId });
    return false;
  }

  await prisma.scoutFarcasterNotification.create({
    data: {
      id: notificationId,
      notificationType,
      fid: user.farcasterId,
      userId,
      templateVariables: {
        title,
        body,
        targetUrl
      }
    }
  });

  return true;
}
