import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import charmClient from 'charmClient';
import BountyDelete from 'components/bounties/components/BountyDelete';
import FieldLabel from 'components/common/form/FieldLabel';
import Modal from 'components/common/Modal';
import { useBounties } from 'hooks/useBounties';
import useIsAdmin from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import { AssignedBountyPermissions } from 'lib/bounties';
import { isBountyLockable, requesterCanDeleteBounty } from 'lib/bounties/shared';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { BountyWithDetails } from 'models';
import BountyStatusBadge from './BountyStatusBadge';

interface Props {
  bounty: BountyWithDetails
  permissions: AssignedBountyPermissions,
}

export default function BountyHeader ({ bounty, permissions }: Props) {
  const { refreshBounty } = useBounties();

  const [user] = useUser();

  const isAdmin = useIsAdmin();

  const bountyDeleteModal = usePopupState({ variant: 'popover', popupId: 'delete-bounty' });

  const closeSubmissionsModal = usePopupState({ variant: 'popover', popupId: 'close-submissions' });

  const closeBountyModal = usePopupState({ variant: 'popover', popupId: 'close-bounty' });

  async function closeBounty () {

    const updatedBounty = await charmClient.closeBounty(bounty!.id);
    refreshBounty(updatedBounty.id);
    closeBountyModal.close();
  }

  async function closeBountySubmissions () {

    const updatedBounty = await charmClient.closeBountySubmissions(bounty!.id);
    refreshBounty(updatedBounty.id);
    closeSubmissionsModal.close();
  }

  if (!bounty) {
    return null;
  }

  const isBountyCreator = (user?.id === bounty?.createdBy) || isAdmin;

  // Menu item conditions
  const canDeleteBounty = permissions?.userPermissions?.delete && requesterCanDeleteBounty({
    requesterIsAdmin: isAdmin,
    bounty,
    requesterCreatedBounty: isBountyCreator
  });

  return (
    <>
      <Box sx={{
        justifyContent: 'space-between',
        gap: 1,
        display: 'flex',
        alignItems: 'center'
      }}
      >
        <Typography fontWeight={500}>Bounty Properties</Typography>
        {/* Provide the bounty menu options */}
        <Box display='flex' gap={2} alignItems='center'>

          {
            (canDeleteBounty || permissions?.userPermissions?.lock) && (
              <Box display='flex'>
                {
                  permissions?.userPermissions?.lock && isBountyLockable(bounty) && (
                    [
                      <Tooltip key='stop-new' arrow placement='right' title={`Prevent new ${bounty.approveSubmitters ? 'applications' : 'submissions'} from being made.`}>
                        <IconButton
                          size='small'
                          onClick={() => {
                            closeSubmissionsModal.open();
                          }}
                        >
                          <LockIcon color='secondary' fontSize='small' />
                        </IconButton>
                      </Tooltip>,
                      <Tooltip key='mark-complete' arrow placement='right' title='Mark this bounty complete and auto-reject all non-reviewed submissions'>
                        <IconButton
                          size='small'
                          onClick={() => {
                            closeBountyModal.open();
                          }}
                        >
                          <CheckCircleIcon color='secondary' fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    ]
                  )
                }

                {
                  canDeleteBounty && (
                    <Tooltip arrow placement='right' title={`Delete bounty ${bounty.status === 'suggestion' ? 'suggestion' : ''}`}>
                      <IconButton
                        size='small'
                        onClick={() => {
                          bountyDeleteModal.open();
                        }}
                      >
                        <DeleteIcon color='secondary' />
                      </IconButton>
                    </Tooltip>
                  )
                }
              </Box>
            )
          }
          <BountyStatusBadge
            bounty={bounty}
            truncate
          />
        </Box>
      </Box>

      <Modal open={bountyDeleteModal.isOpen} onClose={bountyDeleteModal.close}>
        <BountyDelete
          bounty={bounty}
          onCancel={bountyDeleteModal.close}
          onDelete={bountyDeleteModal.close}
        />
      </Modal>

      <Modal title='Confirm' open={closeSubmissionsModal.isOpen} onClose={closeSubmissionsModal.close} size='large'>
        <Box>

          <Typography variant='body2' sx={{ mb: 1 }}>
            Do you want to close this bounty to new submissions?
            <br />
            <br />
            The cap of submissions will be updated to the current number of approved or in progress submissions.
            <br />
            <br />
            You can reopen this bounty for new submissions by updating or removing the maximum submissions limit.
          </Typography>

          <Box component='div' sx={{ columnSpacing: 2, mt: 3 }}>
            <Button
              color='primary'
              sx={{ mr: 2, fontWeight: 'bold' }}
              onClick={closeBountySubmissions}
            >Close {bounty.approveSubmitters ? 'applications' : 'submissions'}
            </Button>

            <Button color='secondary' onClick={closeSubmissionsModal.close}>Cancel</Button>
          </Box>
        </Box>
      </Modal>

      <Modal title='Confirm' size='large' open={closeBountyModal.isOpen} onClose={closeBountyModal.close}>
        <Box>

          <Typography variant='body2' sx={{ mb: 1 }}>
            Do you want to close out this bounty?
            <br />
            <br />
            <b>All non-reviewed submissions will be rejected</b>, and this bounty will move to "complete" status.
            <br />
            <br />
            This decision is permanent.
          </Typography>

          <Box component='div' sx={{ columnSpacing: 2, mt: 3 }}>
            <Button
              color='error'
              sx={{ mr: 2, fontWeight: 'bold' }}
              onClick={closeBounty}
            >Close bounty
            </Button>

            <Button color='secondary' onClick={closeBountyModal.close}>Cancel</Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
