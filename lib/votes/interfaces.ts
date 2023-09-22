import type { User, UserVote, Vote, VoteOptions } from '@charmverse/core/prisma';

export const DEFAULT_THRESHOLD = 50;

export const VOTE_STATUS = ['InProgress', 'Passed', 'Rejected', 'Cancelled'] as const;

export interface VoteDTO extends Omit<Vote, 'id' | 'status' | 'createdAt' | 'postId' | 'pageId' | 'description'> {
  pageId?: string | null;
  postId?: string | null;
  voteOptions: string[];
  spaceId: string;
}

export type UpdateVoteDTO = Pick<Vote, 'status' | 'deadline'>;

export interface UserVoteDTO {
  choices: string[];
}
export interface ExtendedVote extends Vote {
  aggregatedResult: Record<string, number>;
  voteOptions: VoteOptions[];
  userChoice: null | string[];
  totalVotes: number;
}

export type UserVoteExtendedDTO = UserVote & {
  user: Pick<User, 'avatar' | 'username' | 'id'>;
};

export interface SpaceVotesRequest {
  userId: string;
  spaceId: string;
}
