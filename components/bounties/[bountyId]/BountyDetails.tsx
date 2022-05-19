import Box from '@mui/material/Box';
import BountySuggestionApproval from 'components/bounties/components/BountySuggestionApproval';
import BountyDescription from 'components/bounties/[bountyId]/components_v3/BountyDescription';
import BountyHeader from 'components/bounties/[bountyId]/components_v3/BountyHeader';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { useBounties } from 'hooks/useBounties';
import { usePageTitle } from 'hooks/usePageTitle';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { BountyApplicantList } from 'components/bounties/[bountyId]/components/BountyApplicantList';
import BountySubmissions from 'components/bounties/[bountyId]/components_v3/BountySubmissions';

export default function BountyDetails () {

  const [_, setPageTitle] = usePageTitle();
  const { currentBounty, currentBountyId } = useBounties();

  useEffect(() => {
    const bountyTitle = currentBounty?.title;

    if (bountyTitle) {
      setPageTitle(bountyTitle);
    }

  }, [currentBounty?.title]);

  if (!currentBounty || currentBounty?.id !== currentBountyId) {
    return null;
  }

  return (
    <Box py={3} px='80px'>

      <Container top={20}>
        <BountyHeader />

        <BountyDescription />

        {
          currentBounty.status === 'suggestion' && <BountySuggestionApproval bounty={currentBounty} />
        }

        <BountySubmissions bounty={currentBounty} />

        {
          currentBounty.approveSubmitters === true && (
          <BountyApplicantList
            bounty={currentBounty}
            applications={currentBounty.applications}
          />
          )
        }

      </Container>
    </Box>
  );

}

