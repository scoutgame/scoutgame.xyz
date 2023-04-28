import type { Application } from '@charmverse/core/dist/prisma';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { Tooltip, Typography } from '@mui/material';
import { getChainExplorerLink } from 'connectors';

import Link from 'components/common/Link';
import type { ApplicationWithTransactions } from 'lib/applications/actions';
import { isTruthy } from 'lib/utilities/types';

interface Props {
  submission: ApplicationWithTransactions | Application;
}

export default function BountyApplicantActions({ submission }: Props) {
  const transaction = (submission as ApplicationWithTransactions).transactions[0];

  return (
    <>
      {submission.status === 'inProgress' && (
        <Typography color='secondary' variant='body2'>
          Awaiting submission
        </Typography>
      )}

      {submission.status === 'rejected' && (
        <Typography color='error' variant='body2'>
          Rejected
        </Typography>
      )}

      {submission.status === 'complete' && (
        <Typography color='secondary' variant='body2'>
          Awaiting payment
        </Typography>
      )}

      {submission.status === 'applied' && (
        <Typography color='secondary' variant='body2'>
          Awaiting assignment
        </Typography>
      )}

      {submission.status === 'review' && (
        <Typography color='secondary' variant='body2'>
          Awaiting review
        </Typography>
      )}

      {submission.status === 'paid' &&
        (transaction && isTruthy(transaction.chainId) && isTruthy(transaction.transactionId) ? (
          <Link
            external
            href={transaction ? getChainExplorerLink(transaction.chainId, transaction.transactionId) : ''}
            target='_blank'
          >
            <Tooltip title={transaction ? 'View transaction' : ''} placement='top' arrow>
              <Typography color='success' variant='body2'>
                {'Paid '}
                <LaunchIcon sx={{ fontSize: 14 }} />
              </Typography>
            </Tooltip>
          </Link>
        ) : (
          <Typography color='success' variant='body2'>
            {'Paid '}
          </Typography>
        ))}
    </>
  );
}
