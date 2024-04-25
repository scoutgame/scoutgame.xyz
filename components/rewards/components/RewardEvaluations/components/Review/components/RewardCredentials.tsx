import type { CredentialTemplate } from '@charmverse/core/prisma-client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useGetCredentialTemplates } from 'charmClient/hooks/credentials';
import { CredentialReviewStep } from 'components/common/workflows/Credentials/CredentialReviewStep';
import { useRewardCredentials } from 'components/rewards/hooks/useRewardCredentials';
import type { ApplicationWithTransactions } from 'lib/rewards/interfaces';

export type UserCredentialRowProps = {
  credential: { title: string; subtitle: string; iconUrl: string };
  isSmallScreen?: boolean;
  verificationUrl?: string;
};

const preventAccordionToggle = (e: any) => e.stopPropagation();

export function RewardCredentials({
  selectedCredentialTemplates,
  rewardId,
  application
}: {
  selectedCredentialTemplates: string[];
  rewardId: string;
  application?: ApplicationWithTransactions;
}) {
  const { issuableRewardCredentials: issuableCredentials = [] } = useRewardCredentials();
  const issuableRewardCredentials = issuableCredentials.filter((issuable) => issuable.rewardId === rewardId);
  const { credentialTemplates } = useGetCredentialTemplates();

  const pendingCredentials = selectedCredentialTemplates
    .map((templateId) => credentialTemplates?.find((ct) => ct.id === templateId))
    .filter(Boolean) as CredentialTemplate[];

  return (
    <Box display='flex' flexDirection='column' gap={2} onClick={preventAccordionToggle}>
      <Typography variant='body2'>Submitters receive credentials when their submission is approved</Typography>

      <CredentialReviewStep
        canIssueCredentials={issuableRewardCredentials.length > 0}
        issuedCredentials={application?.issuedCredentials ?? []}
        pageId={rewardId}
        pendingCredentials={pendingCredentials}
        type='reward'
      />
    </Box>
  );
}
