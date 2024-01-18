import { log } from '@charmverse/core/log';
import type { CredentialEventType, CredentialTemplate } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { optimism } from 'viem/chains';

import { baseUrl } from 'config/constants';

import { signAndPublishCharmverseCredential } from './attest';

const labels: Record<CredentialEventType, string> = {
  proposal_approved: 'Proposal Approved',
  proposal_created: 'Proposal Created'
};

export async function issueProposalCredentialsIfNecessary({
  proposalId,
  event
}: {
  proposalId: string;
  event: CredentialEventType;
}): Promise<void> {
  const proposalWithSpaceConfig = await prisma.proposal.findFirstOrThrow({
    where: {
      id: proposalId,
      page: {
        type: 'proposal'
      }
    },
    select: {
      selectedCredentialTemplates: true,
      status: true,
      page: {
        select: {
          id: true
        }
      },
      evaluations: {
        orderBy: {
          index: 'asc'
        }
      },
      authors: true,
      space: {
        select: {
          id: true,
          credentialTemplates: true,
          credentialEvents: true
        }
      }
    }
  });

  if (event === 'proposal_created') {
    if (proposalWithSpaceConfig.status === 'draft') {
      return;
    }
  } else if (event === 'proposal_approved') {
    const currentEvaluation = getCurrentEvaluation(proposalWithSpaceConfig.evaluations);

    if (!currentEvaluation) {
      return;
    } else if (
      currentEvaluation.id !== proposalWithSpaceConfig.evaluations[proposalWithSpaceConfig.evaluations.length - 1].id ||
      currentEvaluation.result !== 'pass'
    ) {
      return;
    }
  }

  if (!proposalWithSpaceConfig.space.credentialEvents.includes(event)) {
    // Space doesn't want to issue credentials for this event
    return;
  }

  if (!proposalWithSpaceConfig.selectedCredentialTemplates?.length) {
    return;
  }

  const issuedCredentials = await prisma.issuedCredential.findMany({
    where: {
      credentialEvent: event,
      proposalId,
      userId: {
        in: proposalWithSpaceConfig.authors.map((author) => author.userId)
      }
    }
  });

  // Credential template ids grouped by user id
  const credentialsToIssue: Record<string, string[]> = {};

  for (const author of proposalWithSpaceConfig.authors) {
    proposalWithSpaceConfig.selectedCredentialTemplates.forEach((credentialTemplateId) => {
      if (
        !issuedCredentials.some(
          (issuedCredential) =>
            issuedCredential.credentialTemplateId === credentialTemplateId && issuedCredential.userId === author.userId
        ) &&
        proposalWithSpaceConfig.space.credentialTemplates.some((t) => t.id === credentialTemplateId)
      ) {
        if (!credentialsToIssue[author.userId]) {
          credentialsToIssue[author.userId] = [];
        }
        credentialsToIssue[author.userId].push(credentialTemplateId);
      }
    });
  }

  const uniqueAuthors = Object.keys(credentialsToIssue);

  for (const authorUserId of uniqueAuthors) {
    const credentialsToGiveUser = credentialsToIssue[authorUserId].map(
      (cred) => proposalWithSpaceConfig.space.credentialTemplates.find((t) => t.id === cred) as CredentialTemplate
    );

    const author = await prisma.user.findUniqueOrThrow({
      where: {
        id: authorUserId
      },
      select: {
        wallets: true
      }
    });

    const targetWallet = author.wallets[0];

    if (!targetWallet) {
      log.error(`User ${authorUserId} has no wallet to issue credentials to`, {
        userId: authorUserId,
        proposalId,
        credentialsToIssue
      });
    } else {
      for (const credentialTemplate of credentialsToGiveUser) {
        // Iterate through credentials one at a time so we can ensure they're properly created and tracked
        const publishedCredential = await signAndPublishCharmverseCredential({
          chainId: optimism.id,
          recipient: targetWallet.address,
          credential: {
            type: 'proposal',
            data: {
              name: credentialTemplate.name,
              description: credentialTemplate.description ?? '',
              organization: credentialTemplate.organization,
              // TODO - Add label mapping
              status: labels[event],
              url: `${baseUrl}/permalink/${proposalWithSpaceConfig.page!.id}`
            }
          }
        });

        await prisma.issuedCredential.create({
          data: {
            ceramicId: publishedCredential.id,
            credentialEvent: event,
            credentialTemplate: { connect: { id: credentialTemplate.id } },
            proposal: { connect: { id: proposalId } },
            user: { connect: { id: authorUserId } }
          }
        });
      }
    }
  }
}
