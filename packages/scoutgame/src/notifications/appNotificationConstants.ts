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

export const AppNotificationTypesRecord = {
  weekly_claim: {
    title: 'Weekly Claim',
    description: ({ points }: Variables['weekly_claim']) => `You earned ${points} points this week! Click to Claim!`,
    targetUrl: () => `/claim`
  },
  zero_weekly_claim: {
    title: 'A New Week, A New Opportunity',
    description: () => 'A new week means a fresh opportunity to earn rewards. Start playing.',
    targetUrl: () => `/quests`
  },
  builder_suspended: {
    title: 'Developer suspended',
    description: () => `Your developer card has been suspended`,
    targetUrl: () => `/info/spam-policy`
  },
  nft_transaction_failed: {
    title: 'NFT transaction failed',
    description: ({ builderName }: Variables['nft_transaction_failed']) =>
      `Your transaction failed when purchasing ${builderName}. Try again`,
    targetUrl: ({ builderPath }: Variables['nft_transaction_failed']) => `/u/${builderPath}`
  },
  builder_card_scouted: {
    title: 'Developer card scouted',
    description: ({ scouterName }: Variables['builder_card_scouted']) =>
      `Your developer card has been scouted by ${scouterName}`,
    targetUrl: ({ scouterPath }: Variables['builder_card_scouted']) => `/u/${scouterPath}`
  },
  builder_approved: {
    title: 'Developer approved',
    description: () => `You have been approved as a Scout Game Developer`,
    targetUrl: () => `/profile`
  },
  referral_link_signup: {
    title: 'Referral link signup',
    description: ({ refereeName }: Variables['referral_link_signup']) =>
      `Your referee ${refereeName} signed up using your referral link. Claim your rewards on Monday!`,
    targetUrl: ({ refereePath }: Variables['referral_link_signup']) => `/u/${refereePath}`
  },
  merged_pr_gems: {
    title: 'You got gems!',
    description: ({ gems, partnerRewards }: Variables['merged_pr_gems']) =>
      `You earned ${gems} gems ${partnerRewards ? ` and ${partnerRewards}` : ''} for merging a PR`,
    targetUrl: () => `/profile`
  },
  developer_rank_change: {
    title: 'Your developers are on the move!',
    description: () => 'Your developers are moving in the leaderboard rankings. Check them out!',
    targetUrl: () => `/scout`
  },
  added_to_project: {
    title: 'Added to project',
    description: ({ projectName }: Variables['added_to_project']) =>
      `You have been added to the project ${projectName}`,
    targetUrl: ({ projectPath }: Variables['added_to_project']) => `/p/${projectPath}`
  }
};

export type AppNotificationVariables<T extends keyof typeof AppNotificationTypesRecord> = Variables[T];
