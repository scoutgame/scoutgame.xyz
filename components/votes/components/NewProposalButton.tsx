import Button from 'components/common/Button';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { addPage } from 'lib/pages/addPage';
import { usePages } from 'hooks/usePages';
import type { KeyedMutator } from 'swr';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import useTasks from 'components/nexus/hooks/useTasks';

export default function NewProposalButton ({ mutateProposals }: {mutateProposals: KeyedMutator<ProposalWithUsers[]>}) {
  const { user } = useUser();
  const [currentSpace] = useCurrentSpace();
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const { showPage } = usePageDialog();
  const { setPages } = usePages();
  const { mutate } = useTasks();

  const canCreateProposal = !!userSpacePermissions?.createPage;

  async function onClickCreate () {
    if (currentSpace && user) {
      const { page: newPage } = await addPage({
        spaceId: currentSpace.id,
        createdBy: user.id,
        type: 'proposal'
      });

      setPages(pages => ({
        ...pages,
        [newPage.id]: newPage
      }));

      mutateProposals();
      mutate();
      showPage({
        pageId: newPage.id,
        onClose () {
          mutateProposals();
        }
      });
    }
  }

  return (
    <Tooltip title={!canCreateProposal ? 'You do not have the permission to create a proposal.' : ''}>
      <Box>
        <Button disabled={!canCreateProposal} onClick={onClickCreate}>
          Create Proposal
        </Button>
      </Box>
    </Tooltip>
  );
}
