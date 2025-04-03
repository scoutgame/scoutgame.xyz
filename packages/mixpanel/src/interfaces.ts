export interface MixpanelTrackBase {
  // distinct_id - property name required by mixpanel to identify unique users
  distinct_id: string;
  isAnonymous?: boolean;
  platform?: string; // ReferralPlatform; we dont always rely on the db model, 'farcaster' is a valid platform for example
  ip?: string;
}

export type BaseEvent = {
  userId: string;
  ip?: string;
};

export type NftPurchaseEvent = BaseEvent & {
  amount: number;
  builderPath: string;
  paidWithPoints: boolean;
  season: string;
  nftType: string;
};

type FrontendEvent = BaseEvent & {
  currentPageTitle: string;
  currentDomain: string;
  currentUrlPath: string;
  currentUrlSearch: string;
};

export type ClickScoutButton = FrontendEvent & {
  price: number;
  builderPath: string;
};

export type ClickListButton = FrontendEvent & {
  builderPath: string;
};

export type ClaimPartnerRewardEvent = BaseEvent & {
  partner: string;
  week: string;
  season: string;
};

type CreateProjectEvent = BaseEvent & {
  name: string;
  path: string;
};

type AddProjectContractAddressEvent = BaseEvent & {
  contractAddress: string;
  chainId: number;
  projectId: string;
};

type AddProjectAgentAddressEvent = BaseEvent & {
  walletAddress: string;
  chainId: number;
  projectId: string;
};

type FrameAddedEvent = BaseEvent;

type FrameRemovedEvent = BaseEvent;

export type EventType =
  | 'page_view'
  | 'click_dont_have_farcaster_account'
  | 'click_join_the_sunnys'
  | 'click_share_on_warpcast'
  | 'click_share_on_twitter'
  | 'click_powered_by_charmverse'
  | 'click_need_help'
  | 'copy_referral_link'
  | 'click_telegram_refer_friend_button';

export type MixpanelEventMap = {
  sign_up: BaseEvent;
  sign_in: BaseEvent;
  nft_purchase: NftPurchaseEvent;
  claim_points: BaseEvent;
  daily_claim: BaseEvent;
  daily_claim_streak: BaseEvent;
  connect_github_success: BaseEvent;
  click_scout_button: ClickScoutButton;
  click_list_button: ClickListButton;
  click_moxie_promo: FrontendEvent;
  click_optimism_promo: FrontendEvent;
  click_register_matchup: FrontendEvent;
  page_view: FrontendEvent;
  referral_link_used: BaseEvent & {
    referralCode: string;
    referrerPath: string;
  };
  complete_quest: BaseEvent & {
    questType: string;
  };
  merge_account: BaseEvent & {
    mergedUserId: string;
    retainedUserId: string;
    mergedIdentity: 'telegram' | 'farcaster' | 'wallet';
  };
  verify_email: BaseEvent;
  claim_partner_reward: ClaimPartnerRewardEvent;
  create_project: CreateProjectEvent;
  add_project_contract_address: AddProjectContractAddressEvent;
  add_project_agent_address: AddProjectAgentAddressEvent;
  frame_added: FrameAddedEvent;
  frame_removed: FrameRemovedEvent;
  delist_nft: BaseEvent & {
    developerNftId: string;
  };
  list_nft: BaseEvent & {
    developerNftId: string;
    price: number;
  };
  purchase_nft_listing: BaseEvent & {
    developerNftId: string;
  };
} & Record<EventType, FrontendEvent>;

export type MixpanelEvent = MixpanelEventMap[keyof MixpanelEventMap];
export type MixpanelEventName = keyof MixpanelEventMap;
