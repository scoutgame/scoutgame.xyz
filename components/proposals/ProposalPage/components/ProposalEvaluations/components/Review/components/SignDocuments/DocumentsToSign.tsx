import type { DocumentSigner } from '@charmverse/core/prisma';
import {
  ThumbUpOutlined as ApprovedIcon,
  ThumbDownOutlined as RejectedIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Box, CardContent, Grid, Stack, Tooltip, Typography } from '@mui/material';
import Card from '@mui/material/Card';

import { Button } from 'components/common/Button';
import IconButton from 'components/common/DatabaseEditor/widgets/buttons/iconButton';
import { useDocusign } from 'components/signing/hooks/useDocusign';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import type { DocumentWithSigners } from 'lib/proposals/documentsToSign/getProposalDocumentsToSign';
import { getFormattedDateTime } from 'lib/utils/dates';
import { lowerCaseEqual } from 'lib/utils/strings';

export function DocumentSignerRow({ signer, envelopeId }: { signer: DocumentSigner; envelopeId: string }) {
  const { user } = useUser();
  const { space } = useCurrentSpace();

  const { requestSigningLink } = useDocusign();

  const userIsSigner =
    user?.verifiedEmails.some((verifiedEmail) => lowerCaseEqual(verifiedEmail.email, signer.email)) ||
    user?.googleAccounts.some((googleAccount) => lowerCaseEqual(googleAccount.email, signer.email));

  return (
    <Grid container>
      <Grid item xs={9}>
        <Typography>{signer.name}</Typography>
        <Typography variant='caption'>{signer.email}</Typography>
      </Grid>
      <Grid item xs={3} display='flex' flexDirection='row' justifyContent='flex-end' alignItems='center'>
        {signer.completedAt && (
          <Tooltip title={`Signature time: ${getFormattedDateTime(signer.completedAt)}`}>
            <Typography variant='caption' display='flex' alignItems='center'>
              Signed <CheckIcon sx={{ ml: 1 }} color='success' />
            </Typography>
          </Tooltip>
        )}

        {!signer.completedAt && (
          <Button
            onClick={() => requestSigningLink({ envelopeId, signerEmail: signer.email, spaceId: space?.id as string })}
            color='primary'
            size='small'
            variant='outlined'
            disabled={!userIsSigner}
          >
            Sign
          </Button>
        )}
      </Grid>
    </Grid>
  );
}

export function DocumentRow({
  documentWithSigners,
  onRemoveDoc
}: {
  documentWithSigners: DocumentWithSigners;
  onRemoveDoc?: VoidFunction;
}) {
  return (
    <Stack gap={1}>
      <Box display='flex' width='100%' justifyContent='space-between' alignItems='flex-start'>
        <Typography variant='body1' fontWeight='bold'>
          {documentWithSigners.title}
        </Typography>

        {onRemoveDoc && (
          <Tooltip title='Remove this document from the list of documents to sign'>
            <IconButton
              onClick={onRemoveDoc}
              icon={<DeleteOutlineOutlinedIcon sx={{ mt: 0.2 }} fontSize='small' color='error' />}
            />
          </Tooltip>
        )}
      </Box>
      {documentWithSigners.signers.map((signer) => (
        <DocumentSignerRow key={signer.id} signer={signer} envelopeId={documentWithSigners.docusignEnvelopeId} />
      ))}
    </Stack>
  );
}
