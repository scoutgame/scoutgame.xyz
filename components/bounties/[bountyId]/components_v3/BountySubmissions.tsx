import { useTheme } from '@emotion/react';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CancelIcon from '@mui/icons-material/Cancel';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Application, ApplicationStatus, Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import { Modal } from 'components/common/Modal';
import { useContributors } from 'hooks/useContributors';
import { useUser } from 'hooks/useUser';
import { ReviewDecision } from 'lib/applications/interfaces';
import { applicantIsSubmitter, moveUserApplicationToFirstRow } from 'lib/applications/shared';
import { getDisplayName } from 'lib/users';
import { fancyTrim } from 'lib/utilities/strings';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import { BrandColor } from 'theme/colors';
import SubmissionEditorForm from './SubmissionEditorForm';

interface Props {
  bounty: Bounty
}

export const SubmissionStatusColors: Record<ApplicationStatus, BrandColor> = {
  applied: 'teal',
  rejected: 'red',
  inProgress: 'yellow',
  review: 'orange',
  complete: 'pink',
  paid: 'gray'
};

export const SubmissionStatusLabels: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  rejected: 'Rejected',
  inProgress: 'In progress',
  review: 'Review',
  complete: 'Complete',
  paid: 'Paid'
};

export default function BountySubmissions ({ bounty }: Props) {

  const [user] = useUser();
  const [contributors] = useContributors();
  const theme = useTheme();

  const [submissions, setSubmissions] = useState<Application[] | null>(null);

  const editSubmissionModal = usePopupState({ variant: 'popover', popupId: 'edit-submission' });

  const isReviewer = bounty.reviewer === user?.id;

  useEffect(() => {
    refreshSubmissions();
  }, [bounty]);

  function refreshSubmissions () {
    if (bounty) {
      charmClient.listApplications(bounty.id, true)
        .then(foundSubmissions => {
          setSubmissions(foundSubmissions);
        });
    }
  }

  async function makeSubmissionDecision (applicationId: string, decision: ReviewDecision) {
    await charmClient.reviewSubmission(applicationId, decision);
    refreshSubmissions();
  }

  function submitterUpdatedSubmission () {
    editSubmissionModal.close();
    refreshSubmissions();
  }

  const sortedSubmissions = submissions ? moveUserApplicationToFirstRow(submissions.filter(applicantIsSubmitter), user?.id as string) : [];

  const userSubmission = sortedSubmissions.find(sub => sub.createdBy === user?.id);

  console.log(sortedSubmissions);

  return (
    <Box>
      <Table stickyHeader sx={{ minWidth: 650 }} aria-label='bounty applicant table'>
        <TableHead sx={{
          background: theme.palette.background.dark,
          '.MuiTableCell-root': {
            background: theme.palette.settingsHeader.background
          }
        }}
        >
          <TableRow>
            <TableCell>
              <Box sx={{
                display: 'flex',
                alignItems: 'center'
              }}
              >
                {/* <AutorenewIcon onClick={refreshsubmissions} /> */}
                Submitter
              </Box>
            </TableCell>
            <TableCell>Submission</TableCell>
            {
              /* Hidden until we implement comments

            <TableCell>Last comment</TableCell>
              */
            }

            <TableCell>Status</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        {sortedSubmissions.length > 0 && (
          <TableBody>
            {sortedSubmissions.map((submission, submissionIndex) => (
              <TableRow
                key={submission.id}
                sx={{ backgroundColor: submissionIndex % 2 !== 0 ? theme.palette.background.default : theme.palette.background.light, '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell size='small'>
                  {
                      submission.createdBy === user?.id ? 'You'
                        : getDisplayName(contributors.find(c => c.id === submission.createdBy))
                    }
                </TableCell>
                <TableCell sx={{ maxWidth: '61vw' }}>

                  {!submission.submission
                    ? (
                      <Button type='submit' onClick={editSubmissionModal.open}>Submit work</Button>
                    ) : (

                      submission.createdBy === user?.id ? (
                        <Typography
                          variant='body2'
                          onClick={editSubmissionModal.open}
                          color={theme.palette.primary?.main}
                        >
                          {fancyTrim(submission.submission, 50)}
                        </Typography>
                      ) : (
                        <Typography
                          variant='body2'
                         // TODO Popup an inline charm editor with comments
                        >
                          {fancyTrim(submission.submission, 50)}
                        </Typography>
                      )

                    )}
                </TableCell>
                <TableCell>
                  <Typography>
                    <Chip
                      sx={{ ml: 2 }}
                      label={SubmissionStatusLabels[submission.status]}
                      color={SubmissionStatusColors[submission.status]}
                    />
                  </Typography>

                </TableCell>
                {
                  /*
                  Hidden until we implement comments
                <TableCell align='right' sx={{ gap: 2 }}>
                </TableCell>
                  */
                }

                <TableCell align='right' sx={{ gap: 2 }}>
                  {
                    submission.status === 'review' && isReviewer && (
                      <Box>
                        <AssignmentTurnedInIcon onClick={() => makeSubmissionDecision(submission.id, 'approve')} />
                        <CancelIcon onClick={() => makeSubmissionDecision(submission.id, 'reject')} />
                      </Box>
                    )
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>

      {
        userSubmission && (
          <Modal title='Your submission' open={editSubmissionModal.isOpen} onClose={editSubmissionModal.close} size='large'>
            <SubmissionEditorForm submission={userSubmission} onSubmit={submitterUpdatedSubmission} />
          </Modal>
        )
      }

    </Box>
  );
}
