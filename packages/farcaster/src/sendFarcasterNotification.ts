import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/utils/constants';
import { v4 } from 'uuid';

type Variables = {
  weekly_claim: {
    points: number;
  };
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
    description: ({ points }: Variables['weekly_claim']) => `You earned ${points} points this week! Claim them now!`,
    targetUrl: `${baseUrl}/claim`
  },
  zero_weekly_claim: {
    title: 'A New Week, A New Opportunity',
    description: 'A new week means a fresh opportunity to earn rewards',
    targetUrl: `${baseUrl}/scout`
  },
  builder_suspended: {
    title: 'Developer suspended',
    description: `Your developer card has been suspended`,
    targetUrl: `${baseUrl}/profile`
  },
  nft_transaction_failed: {
    title: 'NFT transaction failed',
    description: ({ builderName }: Variables['nft_transaction_failed']) =>
      `Your NFT transaction failed when purchasing ${builderName}`,
    targetUrl: ({ builderPath }: Variables['nft_transaction_failed']) => `${baseUrl}/u/${builderPath}`
  },
  builder_card_scouted: {
    title: 'Developer card scouted',
    description: ({ scouterName }: Variables['builder_card_scouted']) =>
      `Your developer card has been scouted by ${scouterName}`,
    targetUrl: ({ scouterPath }: Variables['builder_card_scouted']) => `${baseUrl}/u/${scouterPath}`
  },
  builder_approved: {
    title: 'Developer approved',
    description: () => `Your developer card has been approved`,
    targetUrl: `${baseUrl}/profile`
  },
  referral_link_signup: {
    title: 'Referral link signup',
    description: ({ refereeName }: Variables['referral_link_signup']) =>
      `Your referee ${refereeName} signed up using your referral link`,
    targetUrl: ({ refereePath }: Variables['referral_link_signup']) => `${baseUrl}/u/${refereePath}`
  },
  merged_pr_gems: {
    title: 'You got gems!',
    description: ({ gems, partnerRewards }: Variables['merged_pr_gems']) =>
      `You earned ${gems} gems ${partnerRewards ? ` and ${partnerRewards}` : ''} for merging a PR`,
    targetUrl: `${baseUrl}/profile`
  },
  developer_rank_change: {
    title: 'Your developers are on the move!',
    description: 'Your developers are moving in the leaderboard rankings',
    targetUrl: `${baseUrl}/profile?tab=scouts`
  },
  added_to_project: {
    title: 'Added to project',
    description: ({ projectName }: Variables['added_to_project']) =>
      `You have been added to the project ${projectName}`,
    targetUrl: ({ projectPath }: Variables['added_to_project']) => `${baseUrl}/p/${projectPath}`
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
    return;
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
    return;
  }

  if (!user.sendFarcasterNotification) {
    log.debug('User has no farcaster notification preference, not sending farcaster notification', { userId });
    return;
  }

  if (!user.framesNotificationToken) {
    log.debug('User has no frames notification token, not sending farcaster notification', { userId });
    return;
  }

  const body =
    typeof notification.description === 'function'
      ? notification.description(notificationVariables as any)
      : notification.description;

  const targetUrl =
    typeof notification.targetUrl === 'function'
      ? notification.targetUrl(notificationVariables as any)
      : notification.targetUrl;

  const notificationId = v4();

  const title = notification.title;

  log.debug('Sending farcaster notification', {
    userId,
    title,
    notificationType
  });

  await fetch('https://api.warpcast.com/v1/frame-notifications', {
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
}
