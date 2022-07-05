import { Vote } from '@prisma/client';
import { VOTE_STATUS } from './interfaces';

export const isVotingClosed = (vote: Vote) => {
  return vote.status !== VOTE_STATUS[0] || new Date(vote.deadline) <= new Date();
};
