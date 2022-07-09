import { useState } from 'react';
import { Page } from '@prisma/client';
import Button from 'components/common/PrimaryButton';
import { addPage } from 'lib/pages/addPage';
import { useUser } from 'hooks/useUser';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import ProposalDialog from './ProposalDialog';

export default function CreateProposal () {

  const [user] = useUser();
  const [currentSpace] = useCurrentSpace();
  const [page, setPage] = useState<Page | null>();

  async function onClickCreate () {
    if (currentSpace && user) {
      const newPage = await addPage({
        spaceId: currentSpace.id,
        createdBy: user.id,
        type: 'proposal'
      });
      setPage(newPage);
    }
  }

  return (
    <>
      <Button onClick={onClickCreate}>
        Create Proposal
      </Button>
      <ProposalDialog page={page} onClose={() => setPage(null)} />
    </>
  );
}
