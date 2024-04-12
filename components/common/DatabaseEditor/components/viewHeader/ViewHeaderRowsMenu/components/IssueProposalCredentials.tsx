import type { SystemError } from '@charmverse/core/errors';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { Box, ListItemText, Tooltip } from '@mui/material';
import { getChainById } from 'connectors/chains';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { StyledMenuItem } from 'components/common/DatabaseEditor/components/viewHeader/ViewHeaderRowsMenu/components/PropertyMenu';
import { useMultiProposalCredentials } from 'components/proposals/hooks/useProposalCredentials';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { useWeb3Signer } from 'hooks/useWeb3Signer';
import { useSwitchChain } from 'hooks/wagmi';
import type { IssuableProposalCredentialContent } from 'lib/credentials/findIssuableProposalCredentials';
import { conditionalPlural } from 'lib/utils/strings';

export function IssueProposalCredentials({
  selectedPageIds,
  asMenuItem
}: {
  selectedPageIds: string[];
  asMenuItem?: boolean;
}) {
  const { getFeatureTitle } = useSpaceFeatures();

  const { space } = useCurrentSpace();

  const proposalLabel = getFeatureTitle('Proposal');

  const {
    issuableProposalCredentials,
    issueAndSaveProposalCredentials,
    isLoadingIssuableProposalCredentials,
    userWalletCanIssueCredentialsForSpace,
    gnosisSafeForCredentials
  } = useMultiProposalCredentials({ proposalIds: selectedPageIds });
  const { showMessage } = useSnackbar();

  const [publishingCredential, setPublishingCredential] = useState(false);

  const { account, chainId } = useWeb3Account();
  const { signer } = useWeb3Signer();
  const { switchChainAsync } = useSwitchChain();

  async function handleIssueCredentials(_issuableProposalCredentials: IssuableProposalCredentialContent[]) {
    if (!signer || !space?.useOnchainCredentials || !space.credentialsChainId) {
      return;
    }

    if (chainId !== space.credentialsChainId) {
      await switchChainAsync?.({ chainId: space.credentialsChainId });
      return;
    }

    setPublishingCredential(true);

    try {
      const result = await issueAndSaveProposalCredentials(_issuableProposalCredentials);
      if (result === 'gnosis') {
        showMessage('Transaction submitted to Gnosis Safe. Please execute it there');
      } else {
        showMessage(`Issued ${_issuableProposalCredentials.length} proposal credentials`);
      }
    } catch (err: any) {
      if (err.code === 'ACTION_REJECTED') {
        showMessage('Transaction rejected', 'warning');
      } else {
        showMessage(err.message ?? 'Error issuing credentials', (err as SystemError).severity ?? 'error');
      }
      // Hook handles errors
    } finally {
      setPublishingCredential(false);
    }
  }

  const disableIssueCredentials =
    !space?.useOnchainCredentials || !space.credentialsChainId || !space.credentialsWallet
      ? 'A space admin must set up onchain credentials to use this functionality'
      : publishingCredential
      ? 'Issuing credentials...'
      : !issuableProposalCredentials?.length
      ? 'No onchain credentials to issue'
      : !account || !signer
      ? 'Unlock your wallet to issue credentials'
      : !userWalletCanIssueCredentialsForSpace
      ? gnosisSafeForCredentials
        ? `You must be connected as one of the owners of the ${gnosisSafeForCredentials.address} Gnosis Safe on ${
            getChainById(space?.credentialsChainId)?.chainName
          }`
        : `You must be connected with wallet ${space?.credentialsWallet} to issue credentials`
      : undefined;

  const actionLabel = `Issue ${
    issuableProposalCredentials?.length ? `${issuableProposalCredentials?.length} ` : ''
  }Onchain ${conditionalPlural({ word: 'Credential', count: issuableProposalCredentials?.length || 0 })}`;

  async function _handleIssueCredentials() {
    if (!space?.credentialsChainId) {
      return;
    }

    if (chainId !== space?.credentialsChainId) {
      await switchChainAsync?.({ chainId: space.credentialsChainId })
        .then(() => {
          handleIssueCredentials(issuableProposalCredentials ?? []);
        })
        .catch();
    } else {
      handleIssueCredentials(issuableProposalCredentials ?? []);
    }
  }

  // We only enable this feature if the space has onchain credentials enabled
  if (!space?.useOnchainCredentials || !space.credentialsChainId) {
    return null;
  }

  return (
    <Tooltip title={disableIssueCredentials}>
      <Box>
        {asMenuItem ? (
          <div>
            <StyledMenuItem onClick={_handleIssueCredentials} disabled={!!disableIssueCredentials}>
              <CheckCircleOutlinedIcon
                fontSize='small'
                sx={{
                  mr: 1
                }}
              />
              <ListItemText primary={actionLabel} />
            </StyledMenuItem>
          </div>
        ) : (
          <Button
            onClick={() => handleIssueCredentials(issuableProposalCredentials ?? [])}
            variant='contained'
            color='primary'
            loading={publishingCredential || (isLoadingIssuableProposalCredentials && !issuableProposalCredentials)}
            disabled={disableIssueCredentials}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Tooltip>
  );
}
