import { log } from '@charmverse/core/log';
import type { CredentialsExpiredError, NotAuthenticatedError } from '@lens-protocol/client';
import { textOnly } from '@lens-protocol/metadata';
import type {
  BroadcastingError,
  PendingSigningRequestError,
  TransactionError,
  UserRejectedError,
  WalletConnectionError
} from '@lens-protocol/react-web';
import { useCreateComment, useCreatePost } from '@lens-protocol/react-web';
import { useEffect } from 'react';

import { useUpdateProposalLensProperties } from 'charmClient/hooks/proposals';
import { usePageComments } from 'components/[pageId]/Comments/usePageComments';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { LensChain, lensClient } from 'lib/lens/lensClient';
import { uploadToArweave } from 'lib/lens/uploadToArweave';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';

async function switchNetwork() {
  return switchActiveNetwork(LensChain);
}

const LENS_PROPOSAL_PUBLICATION_LENGTH = 50;

function useHandleLensError() {
  const { showMessage } = useSnackbar();
  const handlerLensError = (
    error:
      | BroadcastingError
      | PendingSigningRequestError
      | UserRejectedError
      | WalletConnectionError
      | TransactionError
      | CredentialsExpiredError
      | NotAuthenticatedError
  ) => {
    let errorMessage = '';
    switch (error.name) {
      case 'BroadcastingError': {
        errorMessage = 'There was an error broadcasting the transaction';
        break;
      }

      case 'PendingSigningRequestError': {
        errorMessage = 'There is a pending signing request in your wallet. Approve it or discard it and try again.';
        break;
      }

      case 'WalletConnectionError': {
        errorMessage = 'There was an error connecting to your wallet';
        break;
      }

      case 'UserRejectedError': {
        errorMessage = 'You rejected the transaction';
        break;
      }

      case 'CredentialsExpiredError': {
        errorMessage = 'Your credentials have expired. Please log in again.';
        break;
      }

      case 'NotAuthenticatedError': {
        errorMessage = 'You are not authenticated. Please log in.';
        break;
      }

      case 'TransactionError': {
        errorMessage = 'There was an error with the transaction';
        break;
      }

      default: {
        errorMessage = 'There was an error publishing to Lens';
      }
    }

    log.warn(errorMessage, {
      error
    });
    showMessage(errorMessage, 'error');
  };

  return {
    handlerLensError
  };
}

export function CreateLensPublication(
  params: {
    onError: VoidFunction;
    onSuccess: VoidFunction;
    proposalTitle: string;
    proposalPath: string;
    proposalId: string;
    content: PageContent;
  } & (
    | {
        publicationType: 'post';
      }
    | {
        commentId: string;
        parentPublicationId: string;
        publicationType: 'comment';
      }
  )
) {
  const { onError, onSuccess, proposalId, publicationType, proposalTitle, proposalPath, content } = params;
  const { execute: createPost } = useCreatePost();
  const { updateComment } = usePageComments(proposalId);
  const { execute: createComment } = useCreateComment();
  const { chainId } = useWeb3Account();
  const { trigger: updateProposalLensProperties } = useUpdateProposalLensProperties({ proposalId });
  const { space } = useCurrentSpace();
  const { handlerLensError } = useHandleLensError();
  const { showMessage } = useSnackbar();

  async function createLensPublication() {
    try {
      if (!space) {
        return null;
      }

      if (chainId !== LensChain) {
        await switchNetwork();
      }

      const markdownContent = await generateMarkdown({
        content
      });

      const trimmedMarkdownContent =
        markdownContent.length > LENS_PROPOSAL_PUBLICATION_LENGTH
          ? `${markdownContent.slice(0, LENS_PROPOSAL_PUBLICATION_LENGTH)}...`
          : markdownContent;

      const finalMarkdownContent = `${
        publicationType === 'post'
          ? `Proposal **${proposalTitle}** from **${space.name}** is now open for feedback.\n\n${trimmedMarkdownContent}`
          : trimmedMarkdownContent
      }\n\nView on CharmVerse https://app.charmverse.io/${space.domain}/${proposalPath}${
        publicationType === 'comment' ? `?commentId=${params.commentId}` : ''
      }`;

      const metadata = textOnly({ content: finalMarkdownContent });

      const uri = await uploadToArweave(metadata);
      const capitalizedPublicationType = publicationType.charAt(0).toUpperCase() + publicationType.slice(1);
      if (!uri) {
        return null;
      }

      const createPublicationResult =
        publicationType === 'post'
          ? await createPost({
              metadata: uri
            })
          : await createComment({
              metadata: uri,
              commentOn: params.parentPublicationId as any
            });

      if (createPublicationResult.isFailure()) {
        handlerLensError(createPublicationResult.error);
        onError();
        return null;
      }

      const completion = await createPublicationResult.value.waitForCompletion();

      if (completion.isFailure()) {
        handlerLensError(completion.error);
        onError();
        return null;
      }

      showMessage(`${capitalizedPublicationType} published to Lens`, 'info');
      log.info(`${capitalizedPublicationType} published to Lens`, {
        spaceId: space.id,
        ...params
      });

      const createdPublication = completion.value;

      if (publicationType === 'post') {
        await updateProposalLensProperties({
          lensPostLink: createdPublication.id
        });
      } else if (params.publicationType === 'comment') {
        await updateComment({
          id: params.commentId,
          lensCommentLink: createdPublication.id
        });
      }

      onSuccess();
      return completion.value;
    } catch (err) {
      onError();
      log.error('Error creating publication', {
        err,
        ...params
      });
      showMessage('There was an error publishing to Lens', 'error');
      return null;
    }
  }

  useEffect(() => {
    createLensPublication();
  }, []);

  return null;
}
