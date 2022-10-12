import { gql } from '@apollo/client';

import client from './graphql-client';

export type SnapshotVote = {
  id: string;
  voter: string;
  created: number;
  choice: 1;
  vp: number;
}

interface UserVoteRequest {
  proposalId: string;
  walletAddress: string;
}

export async function getUserProposalVotes ({ proposalId, walletAddress }: UserVoteRequest): Promise<SnapshotVote[]> {
  const { data } = await client.query({
    query: gql`
    query Votes {
      votes(
        where: {
          proposal: "${proposalId}"
          voter: "${walletAddress}"
        },
        orderBy: "created",
        orderDirection: desc
      ) {
        id
        voter
        created
        choice
        vp
      }
    }    
  `
  });

  return data.votes;
}
