type TBountyCardStatus = 'pending' | 'inprogress' | 'done';
type TBountyCardType = 'content' | 'social';

export interface IBountyReward {
  reviewer: string;
  assignee: string;
  token: string;
  amount: number;
}

export interface ICreatingBounty {
  author: string;
  title: string;
  description: Object;
  status: TBountyCardStatus;
  type: TBountyCardType;
  reward: IBountyReward;
}

export type TBountyCard = ICreatingBounty & {
  author: string;
  id: string;
  createdAt: Date;
};

export interface IBountyAction {
  type: string;
  item?: ICreatingBounty;
  itemId?: string;
}
